import React from 'react';
import { StyleSheet, Text, View, Image, Button } from 'react-native';
import { webSocket} from 'rxjs/webSocket';
import { groupBy, mergeMap, takeUntil, finalize } from 'rxjs/operators';
import { timer } from 'rxjs';
import kenwheeler from './ken_wheeler.png';

export default class App extends React.Component {

  state = { randomKens: {} };
  socket$ = webSocket('ws://localhost:8080');

  requestKenHead() {
    const msg = JSON.stringify({ type: 'REQUEST_KEN_HEAD' });
    this.socket$.next(msg);
  }

  componentDidMount() {
    const kenHead$ = this.socket$.pipe(
      groupBy(data => data.id),
      mergeMap(singleKenStream => 
        singleKenStream.pipe(
          takeUntil(
            timer(3000),
          ),
          finalize(() => {
            const dataId = singleKenStream.key;
            const randomKens = { ...this.state.randomKens };
            delete randomKens[dataId];

            this.setState({ randomKens });
          })
        )
      )
    );

    this.subscription = kenHead$.subscribe(data => {
      this.setState({
        randomKens: {
          ...this.state.randomKens,
          [data.id]: { id: data.id, x: data.x, y: data.y }
        }
      });
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Ken is multi-plexing!</Text>
        {Object.values(this.state.randomKens).map(randomKen =>
          <Image 
            key={randomKen.id}
            source={kenwheeler}
            style={{
              position: 'absolute',
              left: randomKen.x,
              top: randomKen.y,
            }}
          />
        )}
        <Button
          onPress={() => this.requestKenHead()}
          title="add a ken bobble"
        />
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
