import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import io from 'socket.io-client';

class App extends Component {
  constructor() {
    super();
    this.state = {
      flag: true,
      socket: null,
      candidates: [
        {
          id: '0',
          img: '1',
          votes: 0,
        },
        {
          id: '1',
          img: '2',
          votes: 0,
        },
        {
          id: '2',
          img: '3',
          votes: 0,
        }
      ]
    };
  }

  componentDidMount() {
    const socket = io('http://ec2-54-238-230-84.ap-northeast-1.compute.amazonaws.com');
    socket.on('init', (d) => {
      console.log(d);
    });
    socket.on('update', data => {
      console.log(data);
    });
    this.setState({ socket });
  }

  componentWillUnmount() {
  }

  handleMessage(message) {
    console.log(JSON.stringify(message));
    //const candidates = this.state.candidates;
    //candidates[message.id] = message.votes;
    //this.setState({ candidates });
  }

  onHandleClick() {
    const candidates = this.state.candidates;
    candidates[0].votes = 10;
    candidates.push({
      id: 3,
      img: 1,
      votes: 300,
    })
    this.setState({ candidates });
  }

  render() {
    return (
      <MuiThemeProvider>
        <div>
          { (this.state.flag) ?
          <List>
          {this.state.candidates.map((value, index) =>
            <ListItem key={index}>
              <FlatButton fullWidth style={{ height: '100%' }} onClick={this.onHandleClick.bind(this)}>
                <img style={{ display: 'block', objectFit: 'contain', width: '100%'}} src={process.env.PUBLIC_URL + `/assets/${value.img}.png`} />
              </FlatButton>
              <p>{value.votes} voted!</p>
            </ListItem>
          )}
          </List>
          : <p>nothing</p> }
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
