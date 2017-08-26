import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Chip from 'material-ui/Chip';
import RefreshIndicator from 'material-ui/RefreshIndicator';

import fetchJSONP from 'fetch-jsonp';
import io from 'socket.io-client';

const style = {
  container: {
    position: 'relative',
  },
  refresh: {
    display: 'inline-block',
    position: 'relative',
  },
};

const modes = {
  TOP: 'TOP',
  LIST: 'LIST',
  RESULT: 'RESULT',
};
const no_image_url = 'http://placehold.jp/240x150.png?text=No Image'

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
    }, (response) => {
      console.log(response);
      const location = {
        latitude: 35.4657858,
        longitude: 139.6201192,
      };
      this.setState({ location });
    }, { timeout: 3000});
  }


  onHandleSearch() {
    console.log('SEARCH', this.state);
    const keyid = 'cb55f4d7ecfceda4f16984f26df4a9b8';
    const url = `https://api.gnavi.co.jp/RestSearchAPI/20150630/?keyid=${keyid}&format=json&input_coordinates_mode=2&latitude=${this.state.location.latitude}&longitude=${this.state.location.longitude}&category_s=RSFST09004`;
    fetchJSONP(url)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        this.setState({ candidates: (json.total_hit_count == 1) ? [json.rest] : json.rest });
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
    this.setState({ wavDone: false })
    const candidates = [].concat(this.state.candidates);
    candidates[0].reservationState = reservationState.CALLING;
    this.setState({ candidates });
    const data = candidates[0];
    const phoneDest = data.tel.replace(/[^0-9]/g, '');
    const phoneCall = `http://153.127.195.16:4567/phonecall?phonefrom=${this.state.phone}&phonedest=${phoneDest}&timestamp=${this.state.timestamp}`;
    fetch(phoneCall, { mode: 'cors' })
      .then((res) => {
        if (res.ok) {
          console.log('succeeded phonecall');
          const timer = setInterval(() => {
            fetch(`http://153.127.195.16/result/${this.state.phone}_${phoneDest}_${this.state.timestamp}.result`, { mode: 'cors' })
              .then((res) => {
                console.log(res);
                if (res.status === 404)
                  return Promise.reject('404');
                 return res.text();
              })
              .then((text) => {
                console.log(text);
                if (text === 'NG') {
                  return
                }
                clearInterval(timer);
                candidates[0].reservationState = reservationState.SUCCEEDED;
                this.setState({ candidates })
                this.setState({ mode: modes.RESULT });
              })
              .catch((err) => {});
            }, 10000);
        } else {
          console.error('could not get a response by phonecall');
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  validate() {
    return ((this.state.location.latitude)
         && (this.state.name.length > 0)
         && (this.state.phone.length > 0)
         && (this.state.numOfPeople > 1));
  }

  render() {
    return (
      <MuiThemeProvider>
        <div className={"reservation-input-area"}>
          { (this.state.mode === modes.TOP) ?
            <Card>
              <h2 style={{ 'border-left': '5px solid red', 'padding-left': '10px'}}>自動電話予約システム</h2>
              <span>名前(カナ):</span> <TextField onChange={(e, v) => this.setState({ name: v})}  errorText={(this.state.name ? '' : '')} /><br />
              <span>電話番号:</span> <TextField onChange={(e, v) => this.setState({ phone: v })}/><br />
              <span>人数:</span> <TextField onChange={(e, v) => this.setState({ numOfPeople: parseInt(v) })}/><br />
              <RaisedButton label="探す" primary={true} onClick={this.onHandleSearch.bind(this)} disabled={!this.validate()}/>
            </Card>
          : (this.state.mode === modes.LIST) ?
            <div style={{ width: '100%'}}>
              <h2 style={{ 'border-left': '5px solid red', 'padding-left': '10px'}}>予約先候補</h2>
                <RaisedButton label="予約する" onClick={this.onHandleReserve.bind(this)} disabled={ !this.state.wavDone } primary={true} style={{ margin: 'auto', 'font-weight': 'bold', display: 'block'}}/>
              <List>
                {this.state.candidates.map((value, index) =>
                  <ListItem key={index} className={"list-item"} >
                    <div style={{ width: "25%", display: 'table-cell', 'vertical-align': 'top', padding: '10px'}}>
                    <img src={value.image_url ?
                      (typeof(value.image_url.shop_image1) == 'string' ? value.image_url.shop_image1 : no_image_url) : no_image_url
                    }
                      style={ { float: 'left', 'margin-right': '20px', width: '100%' } } />
                    </div>
                    <div  style={{ width: "75%", display: 'table-cell', 'vertical-align': 'top'}}>
                    {(value.category ? value.category.split(/　| /) : []).map((value2) =>
                      <Chip style={ { float: 'right', "margin-right": "5px" } }>{value2}</Chip>
                    )}
                    <p><b>{value.name}</b></p>
                    <p style={{"background-color": '#d3edfb' }}>営業時間:{typeof(value.opentime) == 'string' ? value.opentime : '' }</p>
                    <span>最寄駅:{value.access ? value.access.station :''} {value.access ? value.access.walk :''}分 </span><br />
                    <a href={value.url} target={'_blank'} style={{ float: 'right'}}>ページを開く</a>
                    <div  style={ { clear: 'both' } }></div>
                    { (value.reservationState == reservationState.CALLING) ?
                      <RefreshIndicator
                         size={50}
                         left={70}
                         top={0}
                         loadingColor="#FF9800"
                         status="loading"
                         style={style.refresh}
                       /> : ''}
                    { (value.reservationState == reservationState.FAILED) ?  '予約できませんでした': ''} </div>
                  </ListItem>
                )}
              </List>
            </div>
          :
            <div>
              <p>予約できました</p>
              <List>
                {this.state.candidates.filter((d) => d.reservationState === reservationState.SUCCEEDED).map((value, index) =>
                  <ListItem disabled={true} key={index}>
                    <p>{value.name}</p>
                    <p>{value.tel}</p>
                  </ListItem>
                )}
              </List>
            </div>
          }
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
