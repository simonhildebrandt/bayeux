import test from 'tape'
import {BayeuxClient} from '../lib/bayeux'

test('A passing test', (assert) => {
  assert.pass('This test will pass.')

  const client = new BayeuxClient('my-database')
  assert.end()
})
