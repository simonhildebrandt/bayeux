import shoe from 'shoe'
import React from 'react'
import ReactDOM from 'react-dom'
import Baobab from 'baobab'
import { decode } from 'bytewise'



function ViewRow({id, record, update, nuke}) {
  return <tr>
    <td>{ decode(id).join('/') }</td><td>{ record }</td>
    <td>
      <a href="#" onClick={(event) => nuke(event, id) }>X</a>
      <a href="#" onClick={(event) => update(event, id) }>Y</a>
    </td>
  </tr>
}

class Viewer extends React.Component {
  constructor(props) {
    super(props)

    this.subscription = props.subscription

    this.updated = (event) => {
      console.log('say subscription', event)
      this.forceUpdate()
    }
  }

  componentDidMount() {
    this.subscription.cursor().on('update', this.updated)
  }


  componentWillUnmount() {
    this.subscription.cursor().off('update', this.updated)
  }

  data() {
    return this.subscription.cursor().get()
  }

  update(event, id) {
    event.preventDefault()
    this.subscription.update(id)
  }

  nuke(event, id) {
    event.preventDefault()
    this.subscription.delete(id)
  }

  close(event) {
    event.preventDefault()
    this.props.close()
  }

  render() {
    return <table>
      <thead>
        <tr><th>id</th><th>body</th><th><a href="#" onClick={ (event) => this.close(event) }>X</a></th></tr>
      </thead>
      <tbody>
        { Object.entries(this.data()).map(([k, v]) => {
          return <ViewRow id={k} record={v} update={ (event, id) => this.update(event, id) } nuke={ (event, id) => this.nuke(event, id) } />
        }) }
      </tbody>
    </table>
  }
}


class ViewerList extends React.Component {
  constructor(props) {
    super(props)

    this.client = new Client()

    this.state = {
      subscriptions: [this.client.subscribe('all')],
      indices: ['all']
    }
  }

  subscribe(key) {
    this.setState({subscriptions: [...this.state.subscriptions, this.client.subscribe(key)]})
  }

  newView(key) {
    event.preventDefault()
    this.subscribe(key)
  }

  createIndex(event) {
    event.preventDefault()
    console.log(event)
  }

  createDocument(event) {
    if (event.keyCode == 13 && event.shiftKey) {
      event.preventDefault()
      this.client.send({action: 'put', body: event.target.value})
    }
  }

  close(subscription) {
    this.setState({subscriptions: this.state.subscriptions.filter((s) => s !== subscription)})
  }

  render() {
    return <div>
      <div>
        <textarea key="new" ref={(field) => this.create = field } onKeyUp={(event) => this.createDocument(event)}></textarea>
        <input key="name" ref={(field) => this.name = field } type="text"/>
        <input key="input" ref={(field) => this.input = field } type="text" onKeyUp={(event) => this.createIndex(event)}/>

        { this.state.indices.map((key) => {
          return <a href="#" onClick={(event) => this.newView(key)}>{key}</a>
        })}
      </div>
      <div>
        { this.state.subscriptions.map((subscription) => {
          return <Viewer subscription={subscription} close={() => {this.close(subscription)}} />
        }) }
        </div>
    </div>
  }
}


class Subscription {
  constructor(client, key) {
    this.client = client
    this.key = key
  }

  cursor() {
    return this.client.tree.select(this.key)
  }

  delete(id) {
    this.client.delete(this.key, id)
  }

  update(id) {
    this.client.send({action: 'put', id: id, body: new Date().valueOf()})
  }
}

class Client {
  constructor() {
    this.stream = shoe('http://localhost:9999/sub')

    this.stream.on("data", (msg) => {
      console.log(msg)
      this.processMessage(msg)
    })

    this.tree = new Baobab({})
    this.mainCursor = this.tree.select()

    this.subscriptions = {}
  }

  subscribe(key) {
    if (!this.subscriptions[key]) {
      this.tree.select(key).set({})
      this.subscriptions[key] = new Date()
      this.send({action: 'subscribe', key: key})
    }
    return new Subscription(this, key)
  }

  delete(index, id) {
    this.send({action: 'delete', index: index, id: id})
  }

  send(data) {
    console.log('writing', data)
    this.stream.write(JSON.stringify(data))
  }

  processMessage(msg) {
    const data = JSON.parse(msg)
    console.log('heard', data)
    if (data.action === 'put') {
      this.tree.select(data.index).set(data.key, data.value)
    }
    if (data.action === 'del') {
      this.tree.select(data.index).unset(data.key)
    }
  }
}

ReactDOM.render(<ViewerList />, document.getElementById('view'))
