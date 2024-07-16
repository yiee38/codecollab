import { useLocation, useNavigate } from "react-router-dom";
import { Button, Form, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";


export default function LoginView (props) {
  const location = useLocation();
  const [message, setMessage] = useState('');

  const [selectedRole, setSelectedRole] = useState('interviewee');
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage(location.state.message);
    } else {
      setMessage(''); // Set your default message here
    }
  }, [location.state]);

  const handleSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (selectedRole) {
      console.log(`Selected option: ${selectedRole}`);
      navigate(`/room/${selectedRole}/${roomId}`)
    } else {
      console.log("No option selected!");
    }
  };

  const handleRoomIdChange = (event) => {
    event.preventDefault();
    const roomId = event.target.value;
    setRoomId(roomId);
  }


  return (
    <div style={{display: 'flex', flexDirection: 'column', padding: "25px", gap: "8px" }}>
        <h1>Start mock interview</h1>
        <div>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formBasicRadio" style={{display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'baseline'}}>
            <Form.Label style={{marginRight: "5px"}}>Select an Role</Form.Label>
            <Form.Check
              type="radio"
              label="Interviewer"
              name="formHorizontalRadios"
              id="formHorizontalRadios1"
              value="interviewer"
              checked={selectedRole === 'interviewer'}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            <Form.Check
              type="radio"
              label="Interviewee"
              name="formHorizontalRadios"
              id="formHorizontalRadios2"
              value="interviewee"
              checked={selectedRole === 'interviewee'}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            
          </Form.Group>
          <Form.Group  md="3" controlId="validationCustom05" style={{display:"flex", flexDirection: 'row', alignItems: 'baseline', gap: '6px'}}>
            <Form.Label>Room</Form.Label>
            <Form.Control type="text" placeholder="Room ID" required onChange={handleRoomIdChange}/>
            <Form.Control.Feedback type="invalid">
              Please provide a valid Room ID.
            </Form.Control.Feedback>
          </Form.Group>
          <Button variant="primary" type="submit" style={{marginTop: "15px"}}>
            Submit
          </Button>
        </Form>
        </div>
        <></>
        <p>{message}</p>
    </div>
    
  )
}