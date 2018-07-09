import React from 'react';
import { StyleSheet, Text, View, Image, Button } from 'react-native';
import { webSocket} from 'rxjs/webSocket';
import { groupBy, mergeMap, takeUntil, finalize } from 'rxjs/operators';
import { Subscription, timer } from 'rxjs';
import kenwheeler from './ken_wheeler.png';
const sourceImages = [kenwheeler];

export default class App extends React.Component {

  _socket = webSocket('ws://localhost:8080');

  state = { randomKens: [] };
  
  _subscription = new Subscription();
  
  _kenMap = new Map();

  _sendKenStream() {
    this._socket.next(JSON.stringify({
      type: 'sub'
    }));
  }

  componentDidMount() {
    this._subscription.add(
      this._socket.pipe(
        groupBy(data => data.id),
        mergeMap(singleKenStream => 
          singleKenStream.pipe(
            takeUntil(
              timer(3000),
            ),
            finalize(() => {
              const dataId = singleKenStream.key;
              this._kenMap.delete(dataId);
            })
          )
        )
      )
      .subscribe(data => {
        this._kenMap.set(data.id, data);
        this.setState({ randomKens: Array.from(this._kenMap.values()) });
      })
    );
  }

  componentWillUnmount() {
    this._subscription.unsubscribe();
  }

  render() {
    
    return (
      <View style={styles.container}>
        <Text>Ken is multi-plexing!</Text>
        {this.state.randomKens.map((randomKen, i) => <Image 
          key={i}
          source={sourceImages[0]}
          style={{
            position: 'absolute',
            left: randomKen.x,
            top: randomKen.y,
          }}>
        </Image>)}
        <Button 
          onPress={() => this._sendKenStream()}
          title="add a ken bobble"
          ></Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
