import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import io from 'socket.io-client';

const modes = {
  TOP: 'TOP',
  LIST: 'LIST',
  RESULT: 'RESULT',
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      mode: modes.TOP,
      name: '',
      phone: '',
      numOfPeople: 4,
      delay: 15,
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

  onHandleSearch() {
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log(position.coords.latitude);
      console.log(position.coords.longitude);
    });
    this.setState({ mode: modes.LIST });
  }

  onHandleReserve() {
    this.setState({ mode: modes.RESULT });
  }

  render() {
    return (
      <MuiThemeProvider>
        <div>
          { (this.state.mode === modes.TOP) ?
            <div>
              <h1>MONIJIKAI</h1>
              名前(カナ): <TextField /><br />
              人数: <TextField /><br />
              <RaisedButton label="探す" onClick={this.onHandleSearch.bind(this)}/>
            </div>
          : (this.state.mode === modes.LIST) ?
            <div>
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
              <RaisedButton label="予約する" onClick={this.onHandleReserve.bind(this)}/>
            </div>
          :
            <p>予約できました</p>
          }
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
