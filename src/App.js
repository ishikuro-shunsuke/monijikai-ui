import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Chip from 'material-ui/Chip';

import fetchJSONP from 'fetch-jsonp';
import io from 'socket.io-client';

const modes = {
  TOP: 'TOP',
  LIST: 'LIST',
  RESULT: 'RESULT',
};
const no_image_url = 'http://placehold.jp/240x150.png?text=No Image'


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
    }, (response) => {
      console.log(response);
      const location = {
        latitude: 35.6903957,
        longitude: 139.7686287,
      };
      this.setState({ location });
    }, { timeout: 3000});

    /* const socket = io('http://ec2-54-238-230-84.ap-northeast-1.compute.amazonaws.com');
    socket.on('init', (d) => {
      console.log(d);
    });
    socket.on('update', data => {
      console.log(data);
    });
    this.setState({ socket }); */
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

        console.log(json);
        this.setState({ candidates: (json.total_hit_count == 1) ? [json.rest] : json.rest });

      }).catch((ms) => { console.log(ms);});
    this.setState({ mode: modes.LIST });
  }

  onHandleReserve() {
    this.setState({ mode: modes.RESULT });
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
              <RaisedButton label="探す" primary={true} onClick={this.onHandleSearch.bind(this)} disabled={!this.state.location.latitude}/>
            </Card>
          : (this.state.mode === modes.LIST) ?
            <div>
              <h2 style={{ 'border-left': '5px solid red', 'padding-left': '10px'}}>予約先候補</h2>
              <List>
                {this.state.candidates.map((value, index) =>
                  <ListItem key={index} className={"list-item"} >
                    <img src={value.image_url ?
                      (typeof(value.image_url.shop_image1) == 'string' ? value.image_url.shop_image1 : no_image_url) : no_image_url
                    }
                      style={ { float: 'left', 'margin-right': '20px'} } />
                    {(value.category ? value.category.split(/　| /) : []).map((value2) =>
                      <Chip style={ { float: 'right', "margin-right": "5px" } }>{value2}</Chip>
                    )}
                    <p><b>{value.name}</b></p>
                    <p style={{"background-color": '#d3edfb' }}>営業時間:{typeof(value.opentime) == 'string' ? value.opentime : '' }</p>
                    <span>最寄駅:{value.access ? value.access.station :''} {value.access ? value.access.walk :''}分 </span><br />
                    <a href={value.url} target={'_blank'} style={{ float: 'right'}}>ページを開く</a>
                    <div  style={ { clear: 'both' } }></div>
                  </ListItem>
                )}
              </List>
                <RaisedButton label="予約する" onClick={this.onHandleReserve.bind(this)} primary={true} style={{ margin: 'auto', 'font-weight': 'bold', display: 'block'}}/>
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
