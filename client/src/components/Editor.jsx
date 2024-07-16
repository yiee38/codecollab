//import logo from './logo.svg';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import Notepad from './Notepad';
import { CollaborativeEditor } from './QuestionEditor';
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { Navbar, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { v1 as uuidV1 } from 'uuid';




import { EditorState, Text, Facet } from '@codemirror/state';
import { StateField, Compartment, StateEffect } from '@codemirror/state';
import { keymap, EditorView, drawSelection } from '@codemirror/view';
import { basicSetup } from 'codemirror';

import { peerExtension, getDocument, showCaretField, collabEnabledField, shouldCollab } from '../middleware/codemirrorExtensions/collab';
import { underlineExtenstion } from '../middleware/codemirrorExtensions/cursor';
import socket from '../webrtc/socket';
import { getSimplePeerInstance } from '../middleware/singleton/simplePeerManager';
import {  defaultKeymap, indentWithTab } from "@codemirror/commands";
import { useParams } from 'react-router';


function Editor(props) {
  const {role, roomID} = useParams();
  //const [userId, setUserId] = useState(null);
  const editor = useRef(null);
  const editorViewRef = useRef(null);
  const [version, setVersion] = useState(0);
  const [intervieweeTabs, setInteevieweeTabs] = useState([{ name: 'Question', value: 'question',  }]);
  const [interviewerTabs, setIntervieweeTabs] = useState([{ name: 'Question', value: 'question',  },{name: 'Comments', value: 'comments'}]);
  const [activeTab, setActiveTab] = useState('question');
  const [notes, setNotes] = useState([{id: uuidV1(), content: "", time: Date.now(), initialized: false}]);
  const [focusedNote, setFocusedNote] = useState(-1);
  const blockRefs = useRef([null]);
  const initialTimeRef = useRef(Date.now());


  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (roomID !== null) {
      fetch('http://localhost:8080/get_comment?' + new URLSearchParams({
        roomId: roomID,
      }).toString())
        .then(response => 
          {
            const resp = response.json()
            return resp
          }
        )
        .then(data => {
          if (data) {
            if (data.comment === undefined || data.comment === "") { 
              setNotes([{id: uuidV1(), content: "", time: Date.now(), initialized: false}])
            }
            else {
              const commentResponse = JSON.parse(data.comment)
              setNotes(commentResponse);
            }
          }
        });
    }
  }, [roomID])

  useEffect(() => {
    socket.on('code ready', (data) => {
      getDocument(socket, roomID).then(promise=>{
        setVersion(promise.version);
        console.log("code ready")
      })
    })
  }, [])

  useEffect(()=> {
    if (roomID && props.userId) {
      console.log("initiating editor")
      
      getDocument(socket, roomID).then(promise => {
        setVersion(promise.version);

        let doc = Text.of(["/*Start working here*/\n"]);
        if (editor.current) {
          const state = EditorState.create({
            doc: doc,
            lineWrapping: true,
            extensions: [
              basicSetup, 
              showCaretField,
              keymap.of([...defaultKeymap, indentWithTab]),
    
              collabEnabledField,
              drawSelection(),
              //editableCompartment.of(EditorView.editable.of(false)), 
              peerExtension(socket, version, roomID, props.userId),
              underlineExtenstion(props.userId),
            ]
          });
          const view = new EditorView({
            state: state,
            parent: editor.current,
          });
          editorViewRef.current = view;
/*
          const height = editorViewRef.current.lineBlockAtHeight(0).height
          const pointBottomFrom = editorViewRef.current.lineBlockAtHeight( editor.current.offsetTop + editor.current.offsetHeight - editorViewRef.current.documentTop -height)
          const currBottomLine = editorViewRef.current.state.doc.lineAt(pointBottomFrom.from).number
          //console.log(currTopLine)
          setTopVisibleLine(1)
          topRef.current = 1
          setBottomVisibleLine(currBottomLine)
          bottomRef.current = currBottomLine
          */
        }
      })


      

      //Handle mouse in mouse out
     // const peer = getSimplePeerInstance();

      
    }
    

    // Cleanup
    return () => {
      editorViewRef.current?.destroy();
    };
  }, [roomID, props.userId])
  
  return (
    <div style={{display:"flex", flexDirection:"column", height: "100%", paddingTop: "10px" }}>
      
      <div style={{display: "flex", flexDirection: "row", height: "100%", gap: "5px"}}>
        <div style={{overflow: 'hidden', display: "flex", flexDirection: "column", gap: "3px"}}>
          {props.userId!==null && 
            <div style={{display: 'flex', flexDirection: 'row', width: "100%", height: "500px"}}>

              <div >
                
                <div 
                  style={{width: '650px', height: '100%', overflow: 'scroll',}} 
                  ref={editor}
                 //onMouseEnter={() => {handleMouseEnter()}}
                  //onMouseLeave={() => {handleMouseLeave()}}
                  //onMouseMove={(e) => {handleMouseMove(e)}}
                ></div> 
              </div>

              {/*showHistoryEditor && <div ref={historyRef} style={{width: '50%', height: '100%', overflow: 'scroll'}}></div>*/}
            </div>
          }

          
          
        </div>
        <div style={{width: "500px", height: "550px", overflow: "auto", border: "1px solid black", display:"flex", flexDirection: "column",alignItems: "center" }}>
        <Navbar 
          sticky='top'
          variant='light' 
          style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', padding: '16px', width: "100%", backgroundColor: '#fafafa'}}
        >
            <ButtonGroup size='sm' className='bg-body'>

              {props.userId === 2 && intervieweeTabs.map((radio, idx) => (
                <ToggleButton
                  key={idx}
                  id={`radio-${idx}`}
                  type="radio"
                  variant={'outline-secondary'}
                  name="radio"
                  value={radio.value}
                  checked={activeTab === radio.value}
                  onChange={(e) => handleTabClick(radio.value)}
                >
                  {radio.name}
                </ToggleButton>
              ))}
              {props.userId === 1 && interviewerTabs.map((radio, idx) => (
                <ToggleButton
                  key={idx}
                  id={`radio-${idx}`}
                  type="radio"
                  variant={'outline-secondary'}
                  name="radio"
                  value={radio.value}
                  checked={activeTab === radio.value}
                  onChange={(e) => handleTabClick(radio.value)}
                >
                  {radio.name}
                </ToggleButton>
              ))}
            </ButtonGroup>
          </Navbar>
          {props.userId === 1 && activeTab === "comments" && 
            <Notepad
              editorRef={editorViewRef} 
              notes={notes}
              focusedNote={focusedNote}
              blockRefs={blockRefs}
              initialTimeRef={initialTimeRef}
              setNotes={(e) => setNotes(e)}
              setFocusedNote={(e) => setFocusedNote(e)}
            />
          }
        </div>
        

      </div>
     
      
    </div>
  );

}

export default Editor;
