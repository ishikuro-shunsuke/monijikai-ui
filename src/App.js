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

const reservationState = {
  NOT_STARTED: 'NOT_STARTED',
  CALLING: 'CALLING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
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
      timestamp: '',
      location: {
        latitude: null,
        longitude: null,
      },
      wavDone: false,
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
  }

  onHandleSearch() {
    console.log('SEARCH', this.state);
    const keyid = 'cb55f4d7ecfceda4f16984f26df4a9b8';
    const url = `https://api.gnavi.co.jp/RestSearchAPI/20150630/?keyid=${keyid}&format=json&input_coordinates_mode=2&latitude=${this.state.location.latitude}&longitude=${this.state.location.longitude}&category_s=RSFST09004`;
    fetchJSONP(url)
      .then((res) => res.json())
      .then((json) => {
        const candidates = json.rest.map((data) => {
          data.reservationState = reservationState.NOT_STARTED;
          return data;
        });
        this.setState({ candidates });
      });
    this.setState({ mode: modes.LIST });

    const createWavFile = `http://153.127.195.16:8080/create_wav_file?name="${this.state.name}"&personcount="${this.state.numOfPeople}"&ragtime="${this.state.delay}"&phonefrom="${this.state.phone}"`
    fetch(createWavFile, { mode: 'cors' })
      .then((res) => {
        if (res.ok) {
          this.setState({ wavDone: true });
          console.log('succeeded create_wav_file');
        } else {
          console.error('could not get a response by create_wav_file');
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  onHandleReserve() {
    const candidates = [].concat(this.state.candidates);
    candidates.reduce((promise, data) => {
      promise.then(() => {
        const phoneDest = data.tel.replace(/[^0-9]/g, '');
        const phoneCall = `http://153.127.195.16:4567/phonecall?phonefrom=${this.state.phone}&phonedest=${phoneDest}&timestamp=${this.state.timestamp}`;
        fetch(phoneCall, { mode: 'cors' })
          .then((res) => {
            if (res.ok) {
              console.log('succeeded phonecall');
              setInterval(() => {
                fetch(`http://153.127.195.16/result/${this.state.phone}_${phoneDest}_${this.state.timestamp}.result`, { mode: 'cors' })
                  .then((res) => {
                    if (res.status === 404)
                      return '404';
                    Promise.resolve();
                  })
                  .then((text) => {
                    console.log(text);
                    resolve(text);
                  })
                  .catch((err) => {});
              }, 10000);
            } else {
              console.error('could not get a response by phonecall');
              reject();
            }
          })
          .catch((err) => {
            console.error(err);
            reject();
          });
      }, Promise.resolve());
    });
    this.setState({ mode: modes.RESULT });
  })

  validate() {
    return ((this.state.location.latitude)
         && (this.state.name.length > 0)
         && (this.state.phone.length > 0)
         && (this.state.numOfPeople > 1));
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
              <RaisedButton label="探す" onClick={this.onHandleSearch.bind(this)} disabled={!this.validate()}/>
            </div>
          : (this.state.mode === modes.LIST) ?
            <div>
              <List>
                {this.state.candidates.map((value, index) =>
                  <ListItem disabled={value.reservationState !== reservationState.NOT_STARTED } key={index}>
                    {
                      (value.reservationState === reservationState.NOT_STARTED) ? <p>未着手</p> :
                      (value.reservationState === reservationState.CALLING) ? <p>電話中</p> :
                      (value.reservationState === reservationState.FAILED) ? <p>予約失敗</p> :
                      (value.reservationState === reservationState.SUCCEEDED) ? <p>予約成功</p> : <p></p>
                    }
                    <p>{value.name}</p>
                    <p>{value.tel}</p>
                  </ListItem>
                )}
              </List>
              <RaisedButton label="予約する" disabled={ !this.state.wavDone }onClick={this.onHandleReserve.bind(this)}/>
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
