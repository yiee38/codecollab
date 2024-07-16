import { EditorView, Decoration, WidgetType } from "@codemirror/view"
import { StateField, StateEffect, Facet } from "@codemirror/state"
import {nanoid} from "nanoid"
import { collabEnabledField, shouldCollab } from "./collab";

export const addCursor = StateEffect.define();
export const remoteCursor = StateEffect.define();
export const deleteCursor = StateEffect.define();
export const timeoutCursor = StateEffect.define();
export const addSuggestion = StateEffect.define();
export const replaySuggestion = StateEffect.define();
export const remoteReplay = StateEffect.define();

const suggestions = Facet.define();


const idToClass = ["Interviewer", "Interviewee"] //idToClass[id-1]
  
class ToolTipWidget extends WidgetType {
  id = 1
  hidden = false
  bottom=false
  constructor(id, hidden=false, bottom=false) { 
    super() 
    this.id = id
    this.hidden = hidden
    this.bottom = bottom
  }

  eq(other) { return other.id === this.id }

  toDOM() {
    
    let caret = document.createElement("div")
  
    caret.className = 'cm-caret'
    if (this.hidden) {
      caret.className = 'cm-caret cm-hidden'
    }

    let caret_content = document.createElement("span")
    caret_content.className = `cm-caret-inner cm-caret-${this.id}`
    caret_content.textContent = ''
    caret.appendChild(caret_content)

    let caret_wrapper = document.createElement("div")
    caret_wrapper.className = `cm-caret-wrapper`
    
    let caret_label = document.createElement("div")
    if (this.bottom)
      caret_label.className=`cm-caret-label cm-caret-label-bottom cm-caret-label-${this.id}`
    else
      caret_label.className=`cm-caret-label cm-caret-label-up cm-caret-label-${this.id}`

    caret_label.textContent = `${idToClass[this.id - 1]}`

    caret_wrapper.appendChild(caret_label)
    caret.appendChild(caret_wrapper)
    
    setTimeout(()=>{
      caret.children[1].classList.add('cm-hidden') 
      //console.log(caret.children)
    }, 1000)
    
    return caret
  }

  ignoreEvent() { return false }
}


const underlineField = StateField.define({
    create() {
        return Decoration.none
    },
    update(cursors, tr) {
        let cursorTransacions = cursors.map(tr.changes)
        for (const e of tr.effects) {
          //console.log("I got an decoration please")
          if (e.is(remoteCursor)) {
            //console.log("remote?")
            const additions = []
            
            if (e.value.from !== e.value.to){
              additions.push(
                Decoration.mark({class: "cm-highlight-" + e.value.id, id:e.value.id}).range(e.value.from, e.value.to)
              )
            }
            //console.log(e.value.id)

            if (e.value.from === e.value.to ){
              //console.log(tr.startState.field(collabEnabledField))
              if (tr.startState.field(collabEnabledField)){
                if (tr.state.doc.lineAt(e.value.from).number === 1){
                  additions.push(Decoration.widget({
                    widget: new ToolTipWidget(e.value.id, false, true),
                    id: e.value.id,
                    block: false,
                    side: 1
                  }).range(e.value.to))
                }
                else {
                  additions.push(Decoration.widget({
                    widget: new ToolTipWidget(e.value.id, false, false),
                    id: e.value.id,
                    block: false,
                    side: 1
                  }).range(e.value.to))
                }
              }
            }
            cursorTransacions = cursorTransacions.update({
              add: additions,
              filter: (_from, _to, value ) => {
                if (value && value.spec && value.spec.id === e.value.id) {
                  return false;
                }

                return true;
              }
            })
          }
          else if (e.is(addCursor)){
            //console.log("Yooo for now")
          }
          else if (e.is(deleteCursor)){

            if (e.value.timeout){
              
              cursorTransacions = cursorTransacions.update({
                filter: (_from, _to, value ) => {
                  if (_from === e.value.from){
                    return false
                  }
                  return true;
                }
              })

            }
            else {
              //console.log("ei cut that")
              cursorTransacions = cursorTransacions.update({
                add: [],
                filter: (_from, _to, value ) => {
                  if (value && value.spec && value.spec.id === e.value.id) {
                    return false;
                  }
                  return true;
                }
              })
            }
          }

        }
		  return cursorTransacions
    },
    provide: f => EditorView.decorations.from(f)
})

/*
const cursorTheme = EditorView.baseTheme({
    ".cm-underline": { textDecoration: "underline 3px red" },
    ".cm-highlight-1": {
		backgroundColor: "#b1b6d4"
	},
	".cm-highlight-2": {
		backgroundColor: "#F76E6E55"
	},
    ".cm-tooltip.cm-tooltip-cursor": {
        backgroundColor: "#66b",
        color: "white",
        border: "none",
        padding: "2px 7px",
        borderRadius: "4px",
        "& .cm-tooltip-arrow:before": {
          borderTopColor: "#66b"
        },
        "& .cm-tooltip-arrow:after": {
          borderTopColor: "transparent"
        }
    }
})
*/

const cursorTheme = EditorView.baseTheme({
  ".cm-highlight-1": {
		background: 'rgba(134, 31, 65, .3)',
    opacity: 1,
    textColor: '#fafafa'
	},
  ".cm-hidden": {
    opacity: 0,
    transition: 'opacity 0.5s',
  },
  ".cm-shown": {
    opacity: 1,
  },
	".cm-highlight-2": {
		background: 'rgba(0, 60, 113, .3)',
    opacity: 1,
    textColor: '#fafafa'
	},
  ".cm-caret": {
    display: "inline-block",
    //opacity: "0.8"
  },

  ".cm-caret-inner": {
    padding: "0px",
    zIndex: "10",
    animationName: "blink",
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animateTimingFunction: "step-start",
    animateDelay: "0s",
  },
  ".cm-caret-wrapper": {
    width: "0px", 
    height: "0px",
    //opacity: "0.6",
    display: "inline-block",
  },
  ".cm-caret-label-up":{
    marginTop: "-2rem"
  },
  ".cm-caret-label-bottom":{
    marginTop: "0.3rem",
  },
  ".cm-caret-label": {
    border: "none",
		position: "absolute",
		marginLeft: "-2px",
		zIndex: "50",
    color: "white"
  
  },
  ".cm-caret-label-1": {
		backgroundColor: "#861F41 !important",
	},
  ".cm-caret-label-2": {
		backgroundColor: "#003C71 !important",
	},
  ".cm-caret-1": {
    borderLeft: "2px solid #861F41",
  },
  ".cm-caret-2": {
    borderLeft: "2px solid #003C71",
  },
  '@keyframes blink': {
    '0%': {opacity: 1},
    '50%': {opacity: 0},
    '100%%': {opacity: 1},
  },

  ".cm-tooltip.cm-tooltip-cursor": {
    
		border: "none",
		padding: "2px 7px",
		borderRadius: "4px",
		position: "absolute",
		marginTop: "-44px",
		marginLeft: "-13px",
		zIndex: "10",
    color: "white",
    "& .cm-tooltip-arrow:after": {
			borderTopColor: "transparent"
		},
  },
  ".cm-tooltip-cursor-wrap": {
    width: "0px", 
    height: "0px",
    display: "inline-block",
    //opacity: "0.6"
  },

  ".cm-tooltip-1": {
		backgroundColor: "#861F41 !important",
    "& .cm-tooltip-arrow": {
      color: "#861F41 !important"
    },
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#861F41 !important",
		},
	},
	".cm-tooltip-2": {
		backgroundColor: "#003C71 !important",
    "& .cm-tooltip-arrow": {
      color: "#003C71 !important"
    },
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#003C71 !important",
		},
	},
  ".cm-underline-1": {
    textDecoration: "underline dotted 1px #861F41", 
    zIndex: 10
  },
  ".cm-underline-2": {
    textDecoration: "underline dotted 1px #003C71",
    zIndex: 10
  },
})

export const highlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes)

    for (let e of tr.effects) if (e.is(addHighlight)) {
      underlines = underlines.update({
        add: [Decoration.mark({class: "cm-suggestion", id: nanoid()}).range(e.value.from, e.value.to)]
      })
    }
    return underlines
  },
  provide: f => EditorView.decorations.from(f)
})

const addHighlight = StateEffect.define({
  map: ({from, to}, change) => ({from: change.mapPos(from), to: change.mapPos(to)})
})

const highlightTheme = EditorView.baseTheme({
  ".cm-suggestion": { backgroundColor: "rgba(255, 255, 128, 0)" }, 
  ".cm-replaying": {backgroundColor: "rgba(255, 255, 128, 0.5)"}
})

export function highlightSelection(view) {
  let effects = view.state.selection.ranges
    .filter(r => !r.empty)
    .map(({from, to}) => addHighlight.of({from, to}))
  if (!effects.length) return false

  if (!view.state.field(highlightField, false))
    effects.push(StateEffect.appendConfig.of([highlightField,
                                              highlightTheme]))
  view.dispatch({effects})
  return true
}

export const suggestionField = StateField.define({
  create() {
    return {from:[], to: []}
  },
  update(suggestions, tr){
    
    let newSugg = {from:[], to: []}
    if (tr.docChanged){
      const froms = suggestions.from
      const tos = suggestions.to
      for (let i = 0; i<froms.length; i++){
        let from = froms[i]
        let to = tos[i]
        if (from !== -1 && from !== to){

          tr.changes.iterChangedRanges((fromA, toA, fromB, toB)=>{
            const lengthDiff = (toB-fromB) - (toA-fromA)
            if (toA<from){
              from += lengthDiff
              to += lengthDiff
            }
            else if (toA === from) {
              from = fromA
              to += lengthDiff
            }
            else {
              if (toA < to || toA === to) {
                if (fromA<from){
                  from = fromA
                  to += lengthDiff
                }
                else {
                  to += lengthDiff
                }
              }
              else {
                if (fromA<from || fromA === from){
                  from = -1
                  to = -1
                }
                else if (fromA <=from){
                  to = toB
                }
              }
              
            }
            
          })
        }
        newSugg.from.push(from)
        newSugg.to.push(to)
      }
    }
    else{
      newSugg = suggestions
    }
    for (const e of tr.effects ){
      if (e.is(addSuggestion)){
        console.log(e.value.from)
        console.log(e.value.to)
        newSugg.from.push(e.value.from)
        newSugg.to.push(e.value.to)

        /*
        let newSuggestions = suggestions.map((id) => {
          if (e.value.overlapping.includes(id)){
            return e.value.addedId
          }
          else{
            return id
          }
        })
        newSuggestions.push(e.value.addedId)
        console.log(newSuggestions)
        return newSuggestions
        */
      }
    }
    return newSugg
  },
  provide: f => suggestions.from(f)
})

const replayField = StateField.define({
  create() {
    return Decoration.none
  },
  update(replaying, tr){
    let replayingTransactions = replaying.map(tr.changes)
    for (const e of tr.effects) {
      let additions = []
      if (e.is(remoteReplay) || e.is(replaySuggestion)) {
        console.log(e)
        if (e.value.replay && e.value.from !== e.value.to ){
          console.log("")
          additions.push(
            Decoration.mark({class: "cm-replaying"}).range(e.value.from, e.value.to)
          )
          console.log("add deco? ")
        }
        
      }
     // console.log(additions)
      replayingTransactions = replayingTransactions.update({
        add: additions,
        
      })
    }
    
    return replayingTransactions
  },
  provide: f => EditorView.decorations.from(f)
})



export const underlineExtenstion = (id) => {
    return [
		underlineField,
		cursorTheme,
    highlightField,
    highlightTheme,
    suggestionField,
    replayField,
    suggestions.of([]),
		EditorView.updateListener.of(update => {
			update.transactions.forEach(e => { 
				if (e.selection) {
					const cursor = {
            id,
						from: e.selection.ranges[0].from,
						to: e.selection.ranges[0].to
					}
          update.view.dispatch({
						effects: addCursor.of(cursor)
					})

				}
			})
		}),
	];
}

