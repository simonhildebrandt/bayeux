import { connect, table, row, desc } from 'rethinkdb';

import { readFileSync } from 'fs';

var connP = connect({db: 'test'}); // bayeux

async function action(connP) {
  const conn = await connP;

  //const mode = "upload";
  //const mode = "clear";
  const mode = "watch";

  switch(mode) {
    case "upload":
      const json = readFileSync("data/fringe-episodes.json");
      const data = JSON.parse(json);

      const episodes = data._embedded.episodes;

      await table('episodes')
      .insert(episodes)
      .run(conn)
      .then(r => console.log({r}))
      .catch(e => console.log({e}));
      break;
    case "clear":
      await table('episodes').delete().run(conn);
      break;
    case "watch":
      const tableData = [];
      
      await table('episodes').orderBy({index: desc('id')}).limit(3).changes({includeTypes: true, includeInitial: true, includeOffsets: true}).run(conn, (error, cursor) => {
        if (error) {
          console.log({error})
        } else {
          cursor.each((error, change) => {
            console.log({change})
            switch (change.type) {
              case 'initial': 
                tableData.splice(change.new_offset, 0, change.new_val);
                break;
              case 'change': 
                break;  
            }              
            console.table(tableData, ["id", "name"]);
          });
        }
      });

      await table('episodes').orderBy({index: desc('id')}).limit(1).delete().run(conn)
      break;
      default:
      console.error(`${mode} not recognised`)
  }
}

action(connP);

console.log("Done")
