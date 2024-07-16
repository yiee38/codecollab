import { ViewPlugin } from "@codemirror/view"
import { Text, ChangeSet, Facet } from "@codemirror/state"
import { StateEffect, StateField, EditorState } from "@codemirror/state"
import {
  receiveUpdates,
  sendableUpdates,
  collab,
  getSyncedVersion
} from "@codemirror/collab"
import { addCursor, remoteCursor, deleteCursor, timeoutCursor, remoteReplay, replaySuggestion } from "./cursor"

export const showCaret = Facet.define()

export const showCaretEffect =  StateEffect.define()
export const remoteDeleteCursor = StateEffect.define()
export const shouldCollab = StateEffect.define()

export const collabEnabledField = StateField.define({
  create() {
    return true; // Default to collab enabled
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(shouldCollab)) {
        return effect.value; // Toggle the collab state
      }
    }
    return value;
  },
});

/*
const shouldRecord = StateEffect.define();


const recordingEnabledField = StateField.define({
  create() {
    return false; // Default to recording enabled
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(shouldRecord)) {
        return effect.value; // Toggle the recording state
      }
    }
    return value;
  },
});

*/

export const showCaretField = StateField.define({
  create: () => {return {show: true, from: 0, to: 0}},
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(showCaretEffect)){
        return {
          show: e.value.show,
          from: tr.startState.selection.ranges[0].from,
          to: tr.startState.selection.ranges[0].to,
        }
      }
      
    }
    return {
      show: tr.startState.field(showCaretField).show,
      from:tr.startState.field(showCaretField).from,
      to: tr.startState.field(showCaretField).to
    }
  },
})


function pushUpdates(socket, version, fullUpdates, roomId) {
  // Strip off transaction data
  const updates = fullUpdates.map(u => {
   //console.log(u.origin.startState.field(showCaretField))
   let effects = []
   let caret = true
   u.effects.forEach(e => {
    if (e.is(addCursor)){
      
      if (u.origin.startState.field(showCaretField).show ){
        effects.push(e)
        caret = true
      }
      else{
        if (e.value && e.value.id && e.value.from !== undefined ) {
          //console.log("Cursor bonk:")
          const cursor = {
            id: e.value.id,
            from: e.value.from,
            to: e.value.to,
          }
          effects.push(deleteCursor.of(cursor))
          caret = false
        }
      }
    }
    else if (e.is(timeoutCursor)){
      const cursor = {
        id: e.value.id,
        from: e.value.from,
        to: e.value.to,
        timeout: true
      }
      effects.push(deleteCursor.of(cursor))
    }
    else if (e.is(replaySuggestion)){
      console.log("replay!")
      effects.push(replaySuggestion.of({replay:e.value.replay, remotereplay: true, noSelection: e.value.noSelection, from:e.value.from , to:e.value.to} ))
    }
    else if (e.is(showCaretEffect)){

      console.log("hide show")
      if (e.value.show){
        const cursor = {
          id: e.value.id,
          from: e.value.from,
          to: e.value.to,
        }
        effects.push(addCursor.of(cursor))
        caret = true
      }
      else {
        const cursor = {
          id: e.value.id,
          from: e.value.from,
          to: e.value.to,
        }
        effects.push(deleteCursor.of(cursor))
        caret = false
      }
    }
    
   })
   return {
    clientID: u.clientID,
    changes: u.changes.toJSON(),
    effects: effects,
    caret: caret
  }
  })

  //console.log("pushUpdates finished")

  return new Promise(function(resolve) {
    socket.emit("pushUpdates", version, JSON.stringify(updates), roomId, )

    socket.once("pushUpdateResponse", function(status) {
      resolve(status)
    })
  })
}

function pullUpdates(socket, version, roomId, id) {
  //console.log(version)

  return new Promise(function(resolve) {
    socket.emit("pullUpdates", version, roomId)

    socket.once("pullUpdateResponse", function(updates) {
      //console.log("Resolve please?")
      resolve(JSON.parse(updates))
    })
  }).then(updates => 
    updates.map(u => {
     // console.log("pull resolved? ")
      //console.log(u)
      //console.log(u.effects[0])
      if (u.effects[0]) {
        //console.log("been here")
        const effects = []
        u.effects.forEach(effect => {
        
          if (effect.value && effect.value.remotereplay && effect.value.from !== undefined){
            const cursor = {
              from: effect.value.from,
              to: effect.value.to,
              noSelection: effect.value.noSelection,
              replay: effect.value.replay
            }
            effects.push(remoteReplay.of(cursor))
          }
          if (effect.value && effect.value.id && effect.value.from !== undefined && effect.value.id !== id ) {
            //console.log("Cursor bonk:")
            //console.log(effect.value)
            const cursor = {
              id: effect.value.id,
              from: effect.value.from,
              to: effect.value.to
            }
            if (effect.value.timeout){
              //console.log("got u")
              //console.log({...cursor, timeout: true})
              effects.push(deleteCursor.of({...cursor, timeout: true}))
            }
            else{
              if (u.caret){
                effects.push(addCursor.of(cursor))
              }
              else {
                effects.push(deleteCursor.of(cursor))
              }
            }
          }
        })
        //console.log(effects)
        //console.log(u.changes)
        return {
          changes: ChangeSet.fromJSON(u.changes),
          clientID: u.clientID,
          effects
        }
      }
      return {
        changes: ChangeSet.fromJSON(u.changes),
        clientID: u.clientID
      }
    })
  )
}

export function getDocument(socket, roomId) {
  return new Promise(function(resolve) {
    socket.emit("getDocument", roomId)
    //console.log("trying")

    socket.once("getDocumentResponse", function(version, doc) {
      //console.log("got!")
      resolve({
        version,
        doc: Text.of(doc.split("\n"))
      })
    })
  })
}

export const peerExtension = (socket, startVersion, roomId, id) => {
  console.log("my id" + id)
  const plugin = ViewPlugin.fromClass(
    class {
      pushing = false
      done = false
      view = null
      id = 0
      pendingUpdateVersion = null

      constructor(view) {
        this.view = view
        this.pull()
        this.id = id
        //console.log(id)
        //console.log(startVersion)
      }


      update(update) {
        //console.log(update)
        if (update.docChanged || update.transactions.length) 
        {
          this.push()
        }
      }

      async push() {
        const updates = sendableUpdates(this.view.state)
        //console.log(updates)
        if (this.pushing || !updates.length) {
          //console.log("no push huh")
          return
        }
        this.pushing = true
        const version = getSyncedVersion(this.view.state)
        
        //console.log("Synced version" + version)
        await pushUpdates(socket, version, updates, roomId)
        //console.log("pushUpdates finished in push")
        this.pushing = false
        // Regardless of whether the push failed or new updates came in
        // while it was running, try again if there's updates remaining
        //console.log(sendableUpdates(this.view.state))
        if (sendableUpdates(this.view.state).length){
          //console.log("still got something to push???")
          //console.log("pushing?")
          //console.log(this.pushing);
          
          setTimeout(() => this.push(), 100)
          
        }
      }
/*
      async pull() {
        while (!this.done) {
          const version = getSyncedVersion(this.view.state)
          const updates = await pullUpdates(socket, version, roomId, this.id)
          this.view.dispatch(receiveUpdates(this.view.state, updates))
        }
      }
  
      */

      
      async pull() {
        while (!this.done) {
          const version = getSyncedVersion(this.view.state)
          //console.log(version)
          const updates = await pullUpdates(socket, version, roomId, this.id)
          //console.log("version in pull: " + version)
        
          let updatesCopy = []

          let effectsCopy = []
          updates.map(u=>{
            if (u.effects){
              u.effects.map(e => {
                if ( e.value && e.value.id !== id && e.value.from !== undefined && e.value.to !== undefined) {
                  if (e.is(addCursor)){
                    //console.log("addCursor")
                    effectsCopy.push(
                      remoteCursor.of({
                        id: e.value.id,
                        from: e.value.from,
                        to: e.value.to,
                      })
                    )
                  }
                  else if (e.is(remoteReplay)){
                    effectsCopy.push(
                      remoteReplay.of({
                        from: e.value.from, 
                        to: e.value.to, 
                        noSelection: e.value.noSelection,
                        replay: e.value.replay
                      })
                    )
                  }
                  else if (e.is(remoteDeleteCursor)){
                    console.log("hi")
                  }
                  else{
                    if (e.value.timeout){
                      effectsCopy.push(deleteCursor.of({
                        id: e.value.id,
                        from: e.value.from,
                        to: e.value.to,
                        timeout: true,
                      }))
                    }
                    else{
                      effectsCopy.push(deleteCursor.of({
                        id: e.value.id,
                        from: e.value.from,
                        to: e.value.to,
                      }))
                    }
                  }
                }
                
              })
            }
            
            updatesCopy.push({
              changes: u.changes,
              clientID: u.clientID,
              effects: effectsCopy,
            })
          })
          //console.log("updatesCopy")
          try {
            this.view.dispatch(receiveUpdates(this.view.state, updatesCopy))
          }
          catch (e){
            console.log(e)
          }
        

        }
      }
      

      destroy() {
        this.done = true
      }
    }
  )

  return [
    collab(
      { 
        startVersion,
        sharedEffects: tr => {
          let effects = []
          tr.effects.forEach(e => {
            if (e.is(addCursor)){
              //console.log("addCursor")
              effects.push(e)
            }

            if (e.is(replaySuggestion)){
              effects.push(e)
            }

            if (e.is(timeoutCursor)){
              effects.push(e)
            }
            
            if (e.is(showCaretEffect)){
              //console.log("addCursor")

              effects.push(
                showCaretEffect.of({
                  id: id, 
                  show: e.value.show,
                  from: tr.startState.selection.ranges[0].from,
                  to: tr.startState.selection.ranges[0].to,
                })
              )
            }
            
          })
          /*
					const effects = tr.effects.filter(e => {
						return e.is(addCursor) 
					})
          */
         //console.log(effects)

					return effects;
				}
      }
    ), 
    plugin
  ]
}
