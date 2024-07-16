import React, {useState, useRef, useEffect} from "react";
import ContentEditable from "react-contenteditable";
import { useParams } from "react-router-dom";
import { CiTrash } from "react-icons/ci";
import { CiLink } from "react-icons/ci";
import { CiSquareCheck } from "react-icons/ci";
import WarningMessage from "./Warning";
import "./IconButton.css";
import "./Notepad.css";

import { v1 as uuidV1  } from "uuid";

export default function Notepad(props) {
  //const [notes, props.setNotes] = useState([{id: uuidV1(), content: "", time: Date.now(), initialized: false}]);
  //const [focusedNote, props.setFocusedNote] = useState(-1);
  const [linking, setLinking] = useState(false);
  const {role, roomID} = useParams();
  const [warning, setWarning] = useState(-1);
  const [warningMessageContent, setWarningMessageContent] = useState("");

  
  //const props.blockRefs = useRef([null]);
  const caretPosRef = useRef(-1);
  const focusedNoteRef = useRef(-1);
  //const props.initialTimeRef = useRef(Date.now());

  const convertTime = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  const getCaretPosition = (element) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };
  

  const setCaretPosition = (element, position) => {
    const range = document.createRange();
    const selection = window.getSelection();
    
    // Ensure the element has a text node
    if (element.childNodes.length > 0 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
      // Adjust the position if it exceeds the length of the text content
      console.log("child node: ")
      console.log(element.childNodes[0].textContent)
      console.log(element.childNodes[0].textContent.length)
      console.log(position)
      const maxPosition = element.childNodes[0].textContent.length;
      position = Math.min(position, maxPosition);

      
      range.setStart(element.childNodes[0], position);
    } else {
      // If no text node exists, create one
      const textNode = document.createTextNode('');
      element.appendChild(textNode);
      range.setStart(textNode, 0);
    }
    
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const uploadComment = (notes) => {
    console.log("uploading comment")
    const data = {roomId: roomID, comment: JSON.stringify(notes)}
    fetch('http://localhost:8080/update_comment', {
      method: "POST",
      mode: "cors",
      cache: "no-cache", 
      credentials: "same-origin", 
      headers: {
          "Content-Type": "application/json; charset=utf-8",
      },
      redirect: "follow", 
      referrer: "no-referrer", 
      body: JSON.stringify(data)
  }).then(function (response) {
      return response.json();
  })
      .then(function (myJson) {
          console.log(myJson);
      });
  }

  const handleDeleteNote = (index) => {
    const newNotes = [];
    const newNotesRefs = [];
    for(let i = 0; i < props.notes.length; i++){
      if (i !== index) {
        newNotes.push(props.notes[i]);
        newNotesRefs.push(props.blockRefs.current[i]);
      }
    }
    props.blockRefs.current = newNotesRefs;
    
    props.setNotes(newNotes);
    uploadComment(newNotes)
    
  }

  const handleNoteChange = (evt, index) => {
    const newNotes = [...props.notes];
    if (!newNotes[index].initialized) {
      newNotes[index].time = Date.now() - props.initialTimeRef.current;
      newNotes[index].initialized = true;
    }
    newNotes[index].content = evt.target.value;
    props.setNotes(newNotes);
    uploadComment(newNotes);
    //setCaretPos(getCaretPosition());
    caretPosRef.current = getCaretPosition(props.blockRefs.current[index]);
    focusedNoteRef.current = index;
  }

  const handleWarningOff = (index) => {
    setWarning(-1);
    setLinking(true)
    props.setFocusedNote(index)
    props.blockRefs.current[index].focus();

  }

  const handleNoteEnter = (evt, index) => {
    if (evt.key === 'Enter') {
      console.log("index: ", index)
      evt.preventDefault();
      
      if (getCaretPosition(props.blockRefs.current[index]) === evt.target.textContent.length || evt.target.textContent === "") {
        const newNotes = [];
        const newNotesRefs = [];
        let newIndex = index;
        for(let i = 0; i < props.notes.length; i++){
          newNotes.push(props.notes[i]);
          newNotesRefs.push(props.blockRefs.current[i]);
          if (i === index) {
            newNotes.push({id: uuidV1(), content: "", time: Date.now() - props.initialTimeRef.current, initialized: false});
            newNotesRefs.push(null);
            newIndex = i + 1;
          }
        }
        props.blockRefs.current = newNotesRefs;
        props.setNotes(newNotes);
        uploadComment(newNotes);

        setTimeout(() => {
          props.blockRefs.current[index].blur();
          props.blockRefs.current[newIndex]?.focus();

          props.setFocusedNote(newIndex);
        }, 0);
      }
      else {
        const pos = getCaretPosition(props.blockRefs.current[index]);
        //console.log(getCaretPosition()) 

        const leftText = evt.target.textContent.substring(0, pos);
        const rightText = evt.target.textContent.substring(pos);
        const newNotes = [];
        const newNotesRefs = [];
        let newIndex = index;
        for(let i = 0; i < props.notes.length; i++){
          
          if (i === index) {
            newNotes.push({id: props.notes[index].id, content: leftText, time: props.notes[index].time, initialized: props.notes[index].initialized});
            newNotesRefs.push(props.blockRefs.current[i]);
            newNotes.push({id: uuidV1(), content: rightText, time: Date.now() - props.initialTimeRef.current,  initialized: props.notes[index].initialized});
            newNotesRefs.push(null);
            newIndex = i + 1;
          }
          else {
            newNotes.push(props.notes[i]);
            newNotesRefs.push(props.blockRefs.current[i]);
          }
        }
        //console.log("the new index is " + newIndex)
        props.blockRefs.current = newNotesRefs;
        
        props.setNotes(newNotes);
        uploadComment(newNotes);

        setTimeout(() => {
          props.blockRefs.current[index].blur();
          props.blockRefs.current[newIndex]?.focus();

          props.setFocusedNote(newIndex);

        }, 0);
      }
    }
    else if (evt.key==="Backspace" || evt.key==="Delete") {
      if( evt.target.textContent === "" && props.notes.length > 1) {
        const newNotes = [];
        const newNotesRefs = [];
        let newIndex = index - 1 >= 0 ? index - 1 : 0;
        for(let i = 0; i < props.notes.length; i++){
          if (i !== index) {
            newNotes.push(props.notes[i]);
            newNotesRefs.push(props.blockRefs.current[i]);
          }
        }
        props.blockRefs.current = newNotesRefs;
        
        props.setNotes(newNotes);
        uploadComment(newNotes);
        focusedNoteRef.current = newIndex;



        setTimeout(() => {
          props.blockRefs.current[newIndex]?.focus();
          setCaretPosition(props.blockRefs.current[focusedNoteRef.current], props.blockRefs.current[focusedNoteRef.current].textContent.length);

          props.setFocusedNote(newIndex);
        }, 0);

      }
      else if (evt.target.textContent !== "" && getCaretPosition(props.blockRefs.current[index]) === 0 && index !== 0){
        console.log("here now")
        const newNotes = [];
        const newNotesRefs = [];
        let newIndex = index - 1 >= 0 ? index - 1 : 0;
        let oldLength = 0
        for(let i = 0; i < props.notes.length; i++){
          if (i === index && index !== 0) {
            let text = props.notes[i].content;
            oldLength = newNotes[i-1].content.length;
            newNotes[i - 1].content += text;
            newNotes[i - 1].initialized = props.notes[i].initialized;
          }

          else if (i !== index) {
            newNotes.push(props.notes[i]);
            newNotesRefs.push(props.blockRefs.current[i]);
            props.setFocusedNote(newIndex);

          }
        }
        props.blockRefs.current = newNotesRefs;
        
        focusedNoteRef.current = newIndex;
        caretPosRef.current = oldLength;

        props.setNotes(newNotes);
        uploadComment(newNotes);


        setTimeout(() => {
          props.blockRefs.current[newIndex]?.focus();
          props.setFocusedNote(newIndex);

        }, 0);
      }
    }
    else if (evt.key === 'ArrowUp') {
      if (props.notes.length > 1 && getCaretPosition(props.blockRefs.current[index]) === 0) {
        let newIndex = index - 1 >= 0 ? index - 1 : index;
        
        if (newIndex !== index) {
          setTimeout(() => {
            props.blockRefs.current[newIndex]?.focus();
            setCaretPosition(props.blockRefs.current[newIndex], props.blockRefs.current[newIndex].textContent.length);

          }, 0);
        }
      }
    }
    else if (evt.key === 'ArrowDown') {
      if (props.notes.length > 1 && getCaretPosition(props.blockRefs.current[index]) === evt.target.textContent.length) {
        let newIndex = index + 1 < props.notes.length ? index + 1 : index;
        
        if (newIndex !== index) {
          setTimeout(() => {
            props.blockRefs.current[newIndex]?.focus();
            setCaretPosition(props.blockRefs.current[newIndex], 0);

          }, 0);
        }

      }
    }
  }

  const handleLinking = (index) => {

    //props.setFocusedNote(-1);

    const range = props.editorRef.current.state.selection.main;
    console.log(range)
    
    if (range.from !== range.to) {
      const line = props.editorRef.current.state.doc.lineAt(props.editorRef.current.state.selection.ranges[0].from).number
      const newNotes = [...props.notes];
      newNotes[index].line = line;
      props.setNotes(newNotes);
      uploadComment(newNotes);
    } 
    else {
      setWarningMessageContent("Please select some code to link the comment to.")
      setWarning(index);
    }
    setLinking(!linking);
   
  }

  const handleFocusLine = (index) => {
    //props.blockRefs.current[index].focus();
    
  }

  useEffect (() => {
    if (props.focusedNote === -1) {
      setLinking(false);
    }
  }, [props.focusedNote])

  useEffect(() => {
    // Ensure all ContentEditable elements have at least one text node on mount
    props.notes.forEach((note, index) => {
      const element = props.blockRefs.current[index];
      if (element && element.childNodes.length === 0) {
        const textNode = document.createTextNode('');
        element.appendChild(textNode);
      }
    });
    //console.log("NEED SOME UPDATE PLZ!")
    //console.log("caret pos: " + caretPosRef.current);
    //console.log("caret position: " + getCaretPosition());
    if (focusedNoteRef.current !== -1 && caretPosRef.current !== -1) {
      //console.log("maybe i uploaded caret pos to : " + caretPosRef.current)
      setCaretPosition(props.blockRefs.current[focusedNoteRef.current], caretPosRef.current);
      //console.log(getCaretPosition())

      focusedNoteRef.current = -1;
      caretPosRef.current = -1;
    }
  }, [props.notes]);

  useEffect(() => {
    props.initialTimeRef.current = Date.now(); 
  },[]);

  

  /*
  useEffect(() => {
    if (caretPos !== -1 && focusedNote !== -1) {
      setCaretPosition(props.blockRefs.current[focusedNote], caretPos);
    }
  }, [focusedNote])
  */


  

  const placeholderStyle = {
    position: 'absolute',
    top: '5px',
    left: '5px',
    color: '#aaa',
    pointerEvents: 'none',
    zIndex: 0
  };

  const editableStyle = {
    minHeight: "30px",
    borderBottom: "1px dashed #aaa",
    padding: "5px",
    resize: "none",
    maxWidth: "100%",
    flex: 1,
  }

  return (
    <React.Fragment>
      {props.notes.map((note, index) => {
        return (
          <div key={note.id} style={{ padding: "5px", margin: "5px", width: "97%", position: "relative"}} >

            {warning === index && 
              <WarningMessage message={warningMessageContent} onClose={() => {handleWarningOff(index)}} />
            }
            {false && note.initialized && props.focusedNote === index && <span style={{fontSize: "85%", color: "#3a3b3c"}}>{convertTime(note.time)}</span>}
            {false && !note.initialized && props.focusedNote === index && <span style={{fontSize: "85%", color: "#3a3b3c"}}>Write note as anchor for replay</span>}
            <div 
              style={{position: "relative", width: "100%", display: "flex", flexDirection: "row", alignItems:"flex-start"}} 
              
              onFocus={() => {props.setFocusedNote(index)}}
              onBlur={() => {
                console.log("blur")
                //props.setFocusedNote(-1)
              }}
            >
              {props.focusedNote === index && linking &&
                <button 
                  className={`icon-button `}  
                  onClick={() => handleLinking(index)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <CiLink className="icon" />
                </button>
              }
              <div style={{position: "relative", minWidth: "95%", flex: 1}}>
                <ContentEditable
                  className="comment-line"
                  html={note.content}
                  disabled={false} // use true to disable edition
                  onChange={(evt) => {
                    handleNoteChange(evt, index);
                  }} // handle innerHTML change
                  onKeyDown={(evt) => {handleNoteEnter(evt, index)}}
                  tagName="article" // Use a custom HTML tag (uses a div by default)
                  innerRef={el => props.blockRefs.current[index] = el} // a reference to the inner DOM element
                  style={editableStyle}
                  onFocus={() => {
                    props.setFocusedNote(index)
                    setLinking(true);
                    handleFocusLine(index)
                    //console.log(getCaretPosition(props.blockRefs.current[index]))
                    //setCaretPosition(props.blockRefs.current[index], note.content.length)
                  }}
                  onBlur={(e) => {
                    //console.log("blurred?")
                    props.setFocusedNote(-1)
                    setLinking(false);

                  }}
                  
                />
                
                {!note.content && <div style={placeholderStyle}>Type here...</div>}

              </div>
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
}


/*
{
                  false && props.focusedNote === index && 
                  <div style={{marginTop: "5px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    {false && linking && <span style={{fontSize: "85%", color: "#3a3b3c"}}>Select some code for the comment</span>}
                    {false && !linking && note.line && <span style={{fontSize: "85%", color: "#3a3b3c"}}>Line#{note.line}</span>}
                    <div style={{width: "100%", alignItems: "center", justifyContent: "end", display: "flex"}}>
                      <button className={`icon-button ${linking ? 'on' : 'off'}`}  onClick={() => handleLinking(index)}>
                        <CiLink className="icon" />
                      </button>
                    </div>
                  </div>
                }
*/