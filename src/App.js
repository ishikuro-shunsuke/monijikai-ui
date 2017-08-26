import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import fetchJSONP from 'fetch-jsonp';
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
      tel: '',
      numOfPeople: 4,
      delay: 15,
      timestamp: '',
      location: {
        latitude: null,
        longitude: null,
      },
      socket: null,
      candidates: [
        {
          name: '',
          tel: '',
          url: '',
          img: '',
        },
      ],
    };
  }

  componentDidMount() {
    const date = new Date();
    this.setState({ timestamp: date.getTime() });

    navigator.geolocation.getCurrentPosition((position) => {
      console.log('got location')
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      this.setState({ location });
    });

    const socket = io('http://ec2-54-238-230-84.ap-northeast-1.compute.amazonaws.com');
    socket.on('init', (d) => {
      console.log(d);
    });
    socket.on('update', data => {
      console.log(data);
    });
    this.setState({ socket });
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
    console.log('SEARCH', this.state);
    const keyid = 'cb55f4d7ecfceda4f16984f26df4a9b8';
    const url = `https://api.gnavi.co.jp/RestSearchAPI/20150630/?keyid=${keyid}&format=json&input_coordinates_mode=2&latitude=${this.state.location.latitude}&longitude=${this.state.location.longitude}&category_s=RSFST09004`;
    fetchJSONP(url)
      .then((res) => res.json())
      .then((json) => {
        console.log(json.rest);
        const candidates = json.rest;
        this.setState({ candidates });
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
              名前(カナ): <TextField onChange={(e, v) => this.setState({ name: v})}/><br />
              電話番号: <TextField onChange={(e, v) => this.setState({ phone: v })}/><br />
              人数: <TextField onChange={(e, v) => this.setState({ numOfPeople: parseInt(v) })}/><br />
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
