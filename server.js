require("tls").DEFAULT_ECDH_CURVE = "auto"
const express = require('express');
const app = express();
var fs  = require("fs");
var bodyParser = require('body-parser');
const morgan = require('morgan');
require('dotenv').config();
var NodeGeocoder = require('node-geocoder');
const findCycle = require('find-cycle/directed')
const axios = require('axios');
var appendQuery = require('append-query');



app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(express.static(__dirname + '/datasets'));

var port = process.env.PORT || 8080;

var options = {
    provider: 'mapquest',
    apiKey: process.env.MQ_CONSUMER_KEY,
    formatter: null
  };

var geocoder = NodeGeocoder(options);

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/landing_page.html');
});

<<<<<<< HEAD


////////////////////////////////////////////////

// route to '/' to return the html file
app.get('/toDo', function (req, res, next) {
  res.sendFile(__dirname + '/index.html');
});

//route that receives the post body and returns your computation
app.post('/solve', function (req, res, next) {
  console.log(req.body.param2);
  if(!req.body.param22 && !req.body.param23){
    pleaseSolve(req.body, res);
  }
  if(req.body.param22 && req.body.param23 && req.body.param1 && req.body.param2 && req.body.param3){
    pleaseSolveDoublePath(req.body, res);
  }
});


/////////////////////////////////////////////





=======
app.get('/parsley', function(req, res) {
  res.sendFile(__dirname + '/parsley/parsley.js');
})
>>>>>>> 8de3921696e92b1c658b806f88a4745335b61846

app.get('/announces', function(req, res) {
    res.sendFile(__dirname + '/datasets/announces.json');
});

app.get('/communities', function(req, res) {
    res.sendFile(__dirname + "/datasets/communities.json");
});

app.get('/rrc/:num', function(req, res) {
    var obj = JSON.parse(fs.readFileSync(__dirname + '/datasets/rrc.json'));
    var result = obj[req.params.num];
    res.json(result);
});

app.get('/collectors', function(req, res) {
    res.sendFile(__dirname + "/datasets/collectors.json");
});

app.post('/aspath', function(req, res) {
    var as_list = req.body.aspath;
    a(as_list.reverse(), function(aspathcompleto) {
        var result = {"response" : aspathcompleto};
        res.json(result);
    });
});

app.post('/aspaths', function(req, res) {
  var as_list1 = req.body.aspath1.reverse().map(String);
  var as_list2 = req.body.aspath2.reverse().map(String);
  console.log(as_list1, as_list2);
  var pop_x = populate_x(as_list1, as_list2);
  var points_x = pop_x[0];
  a(as_list1, function(aspath1) {
    a(as_list2, function(aspath2) {
      var pop_y = populate_y(aspath1, aspath2);
      var points_y = pop_y[0];
      var points = merge_coordinates(points_x, points_y);
      var discarded = pop_x[1].concat(pop_y[1]).filter(el => {return el.length > 0});
      discarded = [...new Set(discarded.map(v => JSON.stringify(v)))].map(v => JSON.parse(v));
      var result = {
        "response" : points,
        "discarded" : discarded
      }
      res.json(result);
    });
  });

});

app.get('/coordinates/:query', function(req, res) {
    geocoder.geocode(req.params.query)
        .then(result => {
            console.log(result);
            res.json(result[0]);
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(port, function() {
  console.log('App listening on port 8080')
});

function a(aspath, callback) {
    //var aspath = ["3","6939","6505","27735","7049"];

    //var aspath = ["24","2153","38040","23969"];

    //your code here
    fs.readFile("input.txt", "utf8", function(err, data) {
        var i,len;

        var aspathcompleto = [];
        var height = 0;

        item = {};
        item["asn"]=aspath[0];
        item["x"]=0;
        item["y"]=height;
        aspathcompleto.push(item);


        for(i = 0,len = aspath.length; i<len-1; ++i){

            var trovato = false;

            /*LA SINTASSI E' LA SEGUENTE:
                PROVIDER|CUSTOMER|-1
                PEER|PEER|0
            */

            /*PER QUESTO AVREMO 4 CASI DIVERSI:
                Non è detto che troveremo provider/customer oppure peer|peer in questo ordine.
                Ad es 126 e 6939 sono due peer.
                Nel nostro db sono memorizzati in seguente modo 6939|126|0 invece che 126|6939|0.
                Quindi dobbiamo stare attenti perchè la posizione di 2 as in db potrebbe essere invertita.
                Perciò faremo 4 casi differenti.
            */

            /*CASO 1 [AS1=AS2]: VEDIAMO SE SI TRATTA DI UN PEER IN ORDINE AS1|AS2|0*/

            if ((data.indexOf(aspath[i]+"|"+aspath[i+1]+"|"+"0") !== -1)&&(!trovato)) {
                var verifybs = data.indexOf(aspath[i]+"|"+aspath[i+1]+"|"+"0"); //restituisce int (posizione)
                if(data.charAt(verifybs-1).trim() == '') { //verifica se non ci sono altri numeri che precedono aspath
                    console.log(aspath[i]+" = "+aspath[i+1]);
                    item = {};
                    item["asn"]=aspath[i+1];
                    item["x"]=i+1;
                    item["y"]=height;
                    aspathcompleto.push(item);

                    trovato = true;
                }
            }

            /*CASO 2 [AS1<AS2]: VEDIAMO SE SI TRATTA DI UN PROVIDER/CUSTOMER TRA AS1|AS2|-1*/
            if ((data.indexOf(aspath[i]+"|"+aspath[i+1]+"|"+"-1") !== -1)&&(!trovato)){
                var verifybs2 = data.indexOf(aspath[i]+"|"+aspath[i+1]+"|"+"-1");
                if(data.charAt(verifybs2-1).trim() == ''){
                    console.log(aspath[i]+" < "+aspath[i+1]);
                    /*CREAZIONE DI UN OGGETTO JSON AS
                    CHE VERRA' AGGIUNTO ALLA LISTA DI OGGETTI JSON CHIAMATA ASPATHCOMPLETO*/
                    item = {};
                    item["asn"]=aspath[i+1];
                    item["x"]=i+1;
                    item["y"]=height-1;
                    height = height -1;
                    aspathcompleto.push(item);
                    trovato = true;
                }
            }

            /*CASO 3 [AS2=AS1]: VEDIAMO SE SI TRATTA DI UN PEER|PEER TRA AS2|AS1|0*/

            if ((data.indexOf(aspath[i+1]+"|"+aspath[i]+"|"+"0") !== -1)&&(!trovato)){
                var verifybs3 = data.indexOf(aspath[i+1]+"|"+aspath[i]+"|"+"0");
                if(data.charAt(verifybs3-1).trim() == ''){
                    console.log(aspath[i]+" = "+aspath[i+1]);
                    trovato = true;
                    /*CREAZIONE DI UN OGGETTO JSON AS
                    CHE VERRA' AGGIUNTO ALLA LISTA DI OGGETTI JSON CHIAMATA ASPATHCOMPLETO*/
                    item = {};
                    item["asn"]=aspath[i+1];
                    item["x"]=i+1;
                    item["y"]=height;
                    aspathcompleto.push(item);
                }
            }

            /*CASO 4 [AS2>AS1]: VEDIAMO SE SI TRATTA DI UN CUSTOMER|PROVIDER TRA AS2|AS1|-1*/

            if ((data.indexOf(aspath[i+1]+"|"+aspath[i]+"|"+"-1") !== -1)&&(!trovato)){
                var verifybs4 = data.indexOf(aspath[i+1]+"|"+aspath[i]+"|"+"-1");
                if(data.charAt(verifybs4-1).trim() == ''){
                    console.log(aspath[i]+" > "+aspath[i+1]);


                    /*CREAZIONE DI UN OGGETTO JSON AS
                    CHE VERRA' AGGIUNTO ALLA LISTA DI OGGETTI JSON CHIAMATA ASPATHCOMPLETO*/
                    item = {};
                    item["asn"]=aspath[i+1];
                    item["x"]=i+1;
                    item["y"]=height+1;
                    height = height+1;
                    aspathcompleto.push(item);

                    trovato = true;
                }
            }

            if (((data.indexOf(aspath[i]+"|"+aspath[i+1]) == -1) || (data.indexOf(aspath[i]+"|"+aspath[i+1]) != -1))&&(!trovato)){
                console.log(aspath[i] +" ? "+ aspath[i+1] +" It's NOT found :(");


                /*CREAZIONE DI UN OGGETTO JSON AS
                CHE VERRA' AGGIUNTO ALLA LISTA DI OGGETTI JSON CHIAMATA ASPATHCOMPLETO*/
                item = {};
                item["asn"]=aspath[i+1];
                item["x"]=i+1;
                item["y"]=height;
                height = height;
                aspathcompleto.push(item);
            }
        }
        callback(aspathcompleto);
    });
}

/*const edges = {
  0 : [1, 2],
  1 : [2],
  2:  []
};

const startNode = [0];
const getConnectedNodes = node => edges[node];

console.log(findCycle(startNode, getConnectedNodes));*/

//populate_x([], []);
function populate_x(path1, path2) {
  var points = [];
  var nodes1 = {};
  var nodes2 = {};
  var edges1 = {};
  var edges2 = {};
  build_x_graph(path1, 0, nodes1, edges1)
  //console.log(nodes1);
  //console.log(edges1);
  var discarded1 = [];
  var discarded2 = [];
  var discarded3 = [];
  let cycle1 = getCycle(edges1);
  while(cycle1) {
    discarded1.push(resolve_cycle_x(nodes1, edges1, cycle1));
    //console.log(edges);
    //console.log(discarded1);
    cycle1 = getCycle(edges1);
  }
  build_x_graph(path2, Object.keys(nodes1).length, nodes2, edges2)
  //console.log(nodes2);
  //console.log(edges2);
  let cycle2 = getCycle(edges2);
  while(cycle2) {
    discarded2.push(resolve_cycle_x(nodes2, edges2, cycle2));
    cycle2 = getCycle(edges2);
  }
  var nodes = {...nodes1, ...nodes2};
  //console.log(nodes);
  var result = merge_x_graphs(edges1, edges2, nodes);
  let cycle3 = getCycle(result);
  while(cycle3) {
    discarded3.push(resolve_cycle_x(nodes, result, cycle3));
    cycle3 = getCycle(result);
  }
  var discarded = discarded1.concat(discarded2, discarded3).filter(el => {return el.length > 0});
  discarded = [...new Set(discarded.map(v => JSON.stringify(v)))].map(v => JSON.parse(v));;
  //console.log(discarded);

  calculate_x(result, nodes, points);
  return [points, discarded];
}

var path = [
  {
    asn: 'a',
    y: 0
  },
  {
    asn: 'b',
    y: 0,
  },
  {
    asn: 'c',
    y: -1
  },
  {
    asn: 'd',
    y: -2
  },
  {
    asn: 'a',
    y: -3
  }
]

var path2 = [
  {
    asn: 'a',
    y: 0
  },
  {
    asn: 'b',
    y: 0
  },
  {
    asn: 'd',
    y: 0
  }
]

//populate_y(path, path2);
function populate_y(path1, path2) {
  var points = [];
  var nodes1 = {};
  var edges1 = {};
  var nodes2 = {};
  var edges2 = {};
  build_y_graph(path1, 0, nodes1, edges1, [])
  console.log("node_path1");
  console.log(nodes1);
  console.log("edge_path1")
  console.log(edges1);

  var discarded1 = [];
  var discarded2 = [];
  var discarded3 = [];

  let cycle1 = getCycle(edges1);
  if(cycle1) {
    //console.log("cycle");
    //console.log(cycle1);
    discarded1 = resolve_cycle_y(edges1, nodes1, path1, cycle1, 0);
    //console.log("nodes");
    //console.log(nodes1);
    //console.log("edges");
    //console.log(edges1);
    //console.log("disc");
    //console.log(discarded1);
    cycle1 = getCycle(edges1);
    while(cycle1) {
      discarded1.push(resolve_reverse_y(path1, edges1, nodes1, cycle1));
      cycle1 = getCycle(edges1);
    }
  }
  let index = Object.keys(nodes1).length;
  build_y_graph(path2, index, nodes2, edges2, []);
  console.log("node_path2");
  console.log(nodes2);
  console.log("edge_path2")
  console.log(edges2);

  let cycle2 = getCycle(edges2);
  if(cycle2) {
    discarded2 = resolve_cycle_y(edges2, nodes2, path2, cycle2, index)
    //console.log(nodes2);
    //console.log(edges2);
    //console.log(discarded2);
    cycle2 = getCycle(edges2);
    while(cycle2) {
      discarded2.push(resolve_reverse_y(path2, edges2, nodes2, cycle2));
      cycle2 = getCycle(edges2);
    }
  }

  let full_nodes = {...nodes1, ...nodes2};
  var result = merge_y_graphs(edges1, edges2, full_nodes);
  let cycle3 = getCycle(result);

  console.log("nodes");
  console.log(full_nodes);
  console.log("edges");
  console.log(result);
  console.log("cycle");
  console.log(cycle3);

  if(cycle3) {
    let deleted_all = discarded1.concat(discarded2);
    let res = resolve_merge_cycle(path1, path2, result, full_nodes, edges1, nodes1, edges2, nodes2, deleted_all, cycle3);
    if(res.length > 1) {
      full_nodes = res[0];
      result = res[1];
      discarded3 = res[2];
    }
    cycle3 = getCycle(result);
    while(cycle3) {
      discarded3.push(resolve_reverse_y(path1.concat(path2), result, full_nodes, cycle3));
      cycle3 = getCycle(result);
    }
  }

  var discarded = discarded1.concat(discarded2, discarded3).filter(el => {return el.length > 0});
  discarded = [...new Set(discarded.map(v => JSON.stringify(v)))].map(v => JSON.parse(v));
  /*console.log("disc");
  console.log(discarded);
  console.log("full_nodes");
  console.log(full_nodes);
  console.log("graph");
  console.log(result);*/

  calculate_y(result, full_nodes, points);
  return [points, discarded];
}

function build_x_graph(aspath, index, nodes, edges) {

  for(let i = 0; i < aspath.length; i++) {
    new_el = new Set();
    new_el.add(aspath[i]);
    var id = already_exists(new_el, nodes)
    if(id === -1) {
      id = index;
      nodes[id] = new_el;
      edges[id] = new Set();
      index++;
    }
    if(i < aspath.length - 1) {
      edges[id].add(aspath[i + 1]);
    }
  }
  for(let key in edges) {
    edges[key] = Array.from(edges[key]);
    for(let i = 0; i < edges[key].length; i++) {
      let edge = edges[key][i];
      let node = getKey(nodes, edge);
      edges[key][i] = node;
    }
  }
}

function merge_x_graphs(graph1, graph2, node_list) {
  var to_remove = [];
  var result = {...graph1, ...graph2};
  for(let node1 in graph1) {
    let name1 = Array.from(node_list[node1])[0];
    for(let node2 in graph2) {
      let name2 = Array.from(node_list[node2])[0];
      if(name1 == name2) {
        update_edges(result, node1, node2);
        to_remove.push(node2);
      }
    }
  }
  to_remove.forEach(el => {
    delete node_list[el];
    delete result[el];
  });
  return result;
}

function update_edges(result, node1, node2) {
  result[node1] = union(result[node1], result[node2]);
  result[node2] = new Set();
  for(let el in result) {
    result[el] = new Set(result[el]);
    if(result[el].has(node2)) {
      result[el].delete(node2);
      result[el].add(node1);
    }
    result[el] = Array.from(result[el]);
  }
}

function calculate_x(graph, nodes, points) {
  let origins = get_origins(graph);
  let to_enumerate = new Set(Object.keys(graph));

  origins.forEach(origin => {
    for(let node of nodes[origin]) {
      new_point = {};
      new_point.asn = node;
      new_point.x = 0;
      points.push(new_point);
    }
    to_enumerate.delete(origin)
  });
  visit_x(graph, nodes, points, to_enumerate);
  //console.log(nodes);
  //console.log(graph);
  console.log(points);
}

function visit_x(graph, nodes, points, to_enumerate) {
  while(to_enumerate.size > 0) {
    for(var current of to_enumerate) {
      let anchestors = get_anchestors(current, graph);
      let anchestors_x = [];
      anchestors.forEach(anchestor => {
        anchestors_x.push(get_anchestor_x(anchestor, nodes, points));
      });
      if(all_positive(anchestors_x)) {
        let x = Math.max(...anchestors_x) + 1;
        for(let node of nodes[current]) {
          new_point = {};
          new_point.asn = node;
          new_point.x = x;
          points.push(new_point);
        }
        to_enumerate.delete(current);
      }
    }
  }
  return points;
}

function build_y_graph(aspath, index, nodes, edges, deleted) {

  for(let i = 0; i < aspath.length; i++) {
    if(i > 0) {
      let curr = aspath[i];
      let previous = aspath[i - 1];
      console.log(deleted);
      console.log(previous.asn, curr.asn);
      if(!(array_in_matrix(deleted, [previous.asn, curr.asn])) && previous.y === curr.y) {
        nodes[getKey(nodes, previous.asn)].add(curr.asn);
      } else {
        new_el = new Set();
        new_el.add(aspath[i].asn);
        let id = index;
        nodes[id] = new_el;
        index++;
      }
    } else {
      new_el = new Set();
      new_el.add(aspath[i].asn);
      let id = index;
      nodes[id] = new_el;
      index++;
    }
  }
  let to_remove = new Set();
  for(let i in nodes) {
    if(!to_remove.has(i)) {
      let curr = nodes[i];
      let id = already_existsSecond(curr, nodes, i);
      if(id != -1) {
        let next = nodes[id];
        nodes[i] = union(curr, next);
        to_remove.add(id);
      }
    }
  }
  to_remove.forEach(key => {
    delete nodes[key];
  });

  for(let n in nodes) {
    edges[n] = new Set();
  }

  for(let i = 0; i < aspath.length; i++) {
    let source = getKey(nodes, aspath[i].asn);
    if(i < aspath.length - 1) {
      let target = getKey(nodes, aspath[i + 1].asn);
      source_y = aspath[i].y;
      target_y = aspath[i + 1].y;
      if(source_y < target_y) {
        edges[source].add(target);
      } else if(source_y > target_y) {
        edges[target].add(source);
      }
    }
  }
  for(let edge in edges) {
    edges[edge] = Array.from(edges[edge]);
  }
}

function merge_y_graphs(graph1, graph2, node_list) {
  var to_remove = [];
  var result = {...graph1, ...graph2};
  for(let node1 in graph1) {
    let n1 = node_list[node1];
    for(let node2 in graph2) {
      let n2 = node_list[node2];
      //console.log(n1, n2);
      if(contains(n1, n2)) {
        if(n1.size >= n2.size) {
          let new_set = union(n1, n2);
          node_list[node1] = new_set;
          update_edges(result, node1, node2);
          to_remove.push(node2);
        } else {
          let new_set = union(n1, n2);
          node_list[node2] = new_set;
          update_edges(result, node2, node1);
          to_remove.push(node1);
        }
      }
    }
  }
  to_remove.forEach(el => {
    delete node_list[el];
    delete result[el];
  });
  //console.log(node_list);
  //console.log(result);
  return result;
}

function calculate_y(graph, nodes, points) {
  let origins = get_origins(graph);
  let to_enumerate = new Set(Object.keys(graph));

  origins.forEach(origin => {
    for(let node of nodes[origin]) {
      new_point = {};
      new_point.asn = node;
      new_point.y = 0;
      points.push(new_point);
    }
    to_enumerate.delete(origin)
  });
  visit_y(graph, nodes, points, to_enumerate);
  //console.log(nodes);
  //console.log(graph);
  console.log(points);
}

function visit_y(graph, nodes, points, to_enumerate) {
  while(to_enumerate.size > 0) {
    for(var current of to_enumerate) {
      let anchestors = get_anchestors(current, graph);
      let anchestors_y = [];
      anchestors.forEach(anchestor => {
        anchestors_y.push(get_anchestor_y(anchestor, nodes, points));
      });
      if(all_positive(anchestors_y)) {
        let y = Math.max(...anchestors_y) + 1;
        //console.log("nodes");
        //console.log(nodes);
        //console.log(current);
        for(let node of nodes[current]) {
          new_point = {};
          new_point.asn = node;
          new_point.y = y;
          points.push(new_point);
        }
        to_enumerate.delete(current);
      }
    }
  }
  return points;
}

function already_exists(node, nodes) {
  for(var key in nodes) {
    let curr = nodes[key];
    if(isSuperset(curr, node))
      return key;
  }
  return -1;
}

function already_existsSecond(node, nodes, i) {
  for(var key in nodes) {
    let curr = nodes[key];
    if(key != i && contains(curr, node))
      return key;
  }
  return -1;
}

function isSuperset(set, subset) {
  for (var elem of subset) {
    if (!set.has(elem)) {
      return false;
    }
  }
  return true;
}

function contains(set, subset) {
  for (var elem of subset) {
    if (set.has(elem)) {
      return true;
    }
  }
  return false;
}

function getKey(dict, elem) {
  for(var key in dict) {
    if(dict[key].has(elem))
      return key;
  }
  return -1;
}

function getNames(key1, key2, nodes, aspath) {
  let set1 = nodes[key1];
  let set2 = nodes[key2];
  for(let i = 0; i < aspath.length; i++) {
    if(i < aspath.length - 1) {
      let curr1 = aspath[i];
      let curr2 = aspath[i + 1];
      if(set1.has(curr1.asn) && set2.has(curr2.asn) && curr1.y !== curr2.y) {
        return [curr1.asn, curr2.asn];
      }
    }
  }
  return ['', ''];
}

function union(setA, setB) {
  var _union = new Set(setA);
  for (var elem of setB) {
      _union.add(elem);
  }
  return _union;
}

function getCycle(edges) {
  let start_node = Object.keys(edges);
  let get_connected_nodes = node => edges[node];
  let cycle = findCycle(start_node, get_connected_nodes);
  return cycle;
}

function resolve_cycle_x(nodes, edges, cycle) {
  for(let i = 0; i < cycle.length; i++) {
    let el = cycle[i];
    let next = null;
    if(i < cycle.length - 1) {
      next = cycle[i + 1];
    } else {
      next = cycle[0];
    }
    edges[el] = new Set(edges[el]);
    edges[el].delete(next);
    let new_cycle = getCycle(edges);
    if(!new_cycle) {
      edges[el] = Array.from(edges[el]);
      return [Array.from(nodes[el])[0], Array.from(nodes[next])[0]];
    } else {
      edges[el].add(next);
      edges[el] = Array.from(edges[el]);
    }
  }
  return [];
}

function resolve_cycle_y(edges, nodes, aspath, cycle, index) {
  for(let i = 0; i < cycle.length; i++) {
    let el = cycle[i];
    let set = nodes[el];
    if(set.size > 1) {
      let peerings = get_peerings(aspath, set);
      for(let j = 0; j < peerings.length; j++) {
        let deleted = [peerings[j]];
        for(let key in nodes)
          delete nodes[key];
        for(let key in edges)
          delete edges[key];
        build_y_graph(aspath, index, nodes, edges, deleted)
        let new_cycle = getCycle(edges);
        if(!new_cycle) {
          return deleted;
        }
      }
    }
  }
  return [[]];
}

function resolve_merge_cycle(path1, path2, edges, nodes, edges1, nodes1, edges2, nodes2, deleted_all, cycle) {
  for(let i = 0; i < cycle.length; i++) {
    let el = cycle[i];
    let set = nodes[el];
    if(set.size > 1) {
      let peerings = get_peerings(path1, set).concat(get_peerings(path2, set));
      for(let j = 0; j < peerings.length; j++) {
        let deleted = deleted_all;
        if(!array_in_matrix(deleted_all, peerings[j]))
          deleted = deleted.concat([peerings[j]]);
        for(let key in nodes1)
          delete nodes1[key];
        for(let key in edges1)
          delete edges1[key];
        for(let key in nodes2)
          delete nodes2[key];
        for(let key in edges2)
          delete edges2[key];
        build_y_graph(path1, 0, nodes1, edges1, deleted);
        console.log(nodes1);
        build_y_graph(path2, Object.keys(nodes1).length, nodes2, edges2, deleted);
        console.log("after");
        console.log(nodes2);
        let new_nodes = {...nodes1, ...nodes2};
        let new_graph = merge_y_graphs(edges1, edges2, new_nodes);
        let new_cycle = getCycle(new_graph);
        console.log("new_cycle");
        console.log(new_cycle);
        if(!new_cycle) {
          console.log("new_nodes");
          console.log(new_nodes);
          console.log("new_graph");
          console.log(new_graph);
          return [new_nodes, new_graph, deleted];
        }
      }
    }
  }
  return [[]];
}

function resolve_reverse_y(aspath, edges, nodes, cycle) {
  for(let i = 0; i < cycle.length; i++) {
    let el = cycle[i];
    let next = null;
    if(i < cycle.length - 1) {
    next = cycle[i + 1];
    } else {
      next = cycle[0];
    }
    edges[el] = new Set(edges[el])
    edges[el].delete(next);
    edges[next] = new Set(edges[next])
    edges[next].add(el);
    let new_cycle = getCycle(edges);
    if(!new_cycle) {
      edges[el] = Array.from(edges[el]);
      edges[next] = Array.from(edges[next]);
      let values = getNames(el, next, nodes, aspath);
      return [values[0], values[1]];
    } else {
      edges[el].add(next);
      edges[el] = Array.from(edges[el]);
      edges[next].delete(el);
      edges[next] = Array.from(edges[next]);
    }
  }
  return [];
}

function get_origins(graph) {
  let result = [];
  for(let el in graph) {
    let anc = get_anchestors(el, graph);
    if(anc.length == 0) {
      result.push(el);
    }
  }
  return result;
}

function get_anchestors(node, graph) {
  let result = [];
  for(let el in graph) {
    if(graph[el].includes(node)) {
      result.push(el);
    }
  }
  return result;
}

function get_anchestor_x(anchestor, nodes, points) {
  let set = nodes[anchestor];
  let name = Array.from(set)[0]
  for(let i = 0; i < points.length; i++) {
    if(points[i].asn == name)
      return points[i].x;
  }
  return -1;
}

function get_anchestor_y(anchestor, nodes, points) {
  let set = nodes[anchestor];
  let name = Array.from(set)[0]
  for(let i = 0; i < points.length; i++) {
    if(points[i].asn == name)
      return points[i].y;
  }
  return -1;
}

function all_positive(arr) {
  for(let i = 0; i < arr.length; i++) {
    if(arr[i] < 0) return false;
  }
  return true;
}

function get_peerings(aspath, set) {
  let result = [];
  for(let i = 0; i < aspath.length; i++) {
    let curr = aspath[i].asn;
    if(i < aspath.length - 1) {
      let next = aspath[i + 1].asn;
      if(set.has(curr) && set.has(next)) {
        result.push([curr, next]);
      }
    }
  }
  return result;
}

function array_in_matrix(matrix, array) {
  var item_as_string = JSON.stringify(array);

  var contains = matrix.some(function(ele) {
    return JSON.stringify(ele) === item_as_string;
  });
  return contains;
}

function merge_coordinates(points_x, points_y) {
  let new_points = [];
  for(let i = 0; i < points_x.length; i++) {
    let a = points_x[i];
    let element = {};
    for(let j = 0; j < points_y.length; j++) {
      let b = points_y[j];
      if(a.asn === b.asn) {
        element.asn = a.asn;
        element.x = a.x;
        element.y = b.y;
        new_points.push(element);
        break;
      }
    }
  }
  return new_points;
}






//////////////////////////////////////////////////////
/////////////////////////////////////////////////////


function pleaseSolve(parms, res) {
  var ip = parms.param1;
  var date = parms.param2;
  var time = parms.param3;
  var rrc = parms.param4;
console.log(ip,date,time,rrc);
  var dateTime = date.concat("T"+time);
  console.log(date + " " +time );


  var a = getFirstQuery(ip,dateTime,rrc);
   //appendQuery(`https://stat.ripe.net/data/bgp-state/data.json`,`resource=${ip}&timestamp=${dateTime}&rrcs=${rrc}`);

  //console.log(appendQuery);
  //AXIOS: Promise based HTTP client for the browser and node.js
  axios.get(a).then((response) =>  {
    var tPrefix = response.data.data.bgp_state[1].target_prefix;
    var nRoutes = response.data.data.nr_routes;

    //console.log(response.data.data);
    if (response.data.status_code != 200) {
      throw new Error('Unable to find that address.');
    }
    if(response.data.data.bgp_state[1] == null){
      throw new Error('No info about this route. Advice: Try to change rrc');

    }
    var aspath = response.data.data.bgp_state[1].path;
    var community = response.data.data.bgp_state[1].community;
    console.log("AS-PATH: "+aspath);
    console.log("COMMUNITY: "+community);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('The query was: ip=> '+ip+ '\nDate => '+date+'\n \n \nRETRIEVED DATA:\n \nASPATH is \n'+ aspath +'\n \nCommunity: \n' +community+ '\n \nRRC:'+rrc+'\n \nTarget prefix: '+tPrefix+'\n \nN. of BGP routes observed at that time: '+nRoutes);
  })
   /*.then((res) => {  })*/
  .catch((e) => {
    if(e.code === 'ENOTFOUND'){
      console.log('Unable to connect to API servers');
    } else {
      console.log(e.message);
    }
  });
}

function getFirstQuery(ip,isoTimeDateFirst,rrc) {
  return axios.get(`https://stat.ripe.net/data/bgp-state/data.json?resource=${ip}&timestamp=${isoTimeDateFirst}&rrcs=${rrc}`);
}
function getSecondQuery(ip,isoTimeDateSecond,rrc){
  return axios.get(`https://stat.ripe.net/data/bgp-state/data.json?resource=${ip}&timestamp=${isoTimeDateSecond}&rrcs=${rrc}`);
}

function pleaseSolveDoublePath(parms, res) {
  var ip = parms.param1;
  var dateFirst = parms.param2;
  var timeFirst = parms.param3;
  var rrc = parms.param4;

  var dateSecond = parms.param22;
  var timeSecond = parms.param23;

  var dateTimeFirst = dateFirst.concat("T"+timeFirst);
  var dateTimeSecond = dateSecond.concat("T"+timeSecond)

  console.log(dateTimeFirst+"\n");
  console.log(dateTimeSecond+"\n");

  //AXIOS: Promise based HTTP client for the browser and node.js

    axios.all([getFirstQuery(ip,dateTimeFirst,rrc),getSecondQuery(ip,dateTimeSecond,rrc)])
    .then(axios.spread(function (responseA, responseB) {

      console.log(responseA.data.data)




    if (responseA.data.status_code != 200) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end("Unable to find that address");
      throw new Error('Unable to find that address.');

    }
    if(responseA.data.data.bgp_state[1] == null){
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end("No info about this route. Advice: Try to change rrc");
      throw new Error('No info about this route. Advice: Try to change rrc');

    }
    var tPrefix = responseA.data.data.bgp_state[1].target_prefix;
    var nRoutes = responseA.data.data.nr_routes;

    var aspath = responseA.data.data.bgp_state[1].path;
    var community = responseA.data.data.bgp_state[1].community;

    console.log("AS-PATH: "+aspath);
    console.log("COMMUNITY: "+community);


    if (responseB.data.status_code != 200) {
      throw new Error('Unable to find that address.');
    }
    if(responseB.data.data.bgp_state[1] == null){
      throw new Error('No info about this route. Advice: Try to change rrc');

    }
    var aspathSecond = responseB.data.data.bgp_state[1].path;
    var communitySecond = responseB.data.data.bgp_state[1].community;

    console.log("AS-PATH: "+aspathSecond);
    console.log("COMMUNITY: "+communitySecond);


    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('The query was: ip=> '+ip+ '\nDate => '+dateFirst+'\n \n \nRETRIEVED DATA:\n \nFIRST ASPATH is \n'+aspath +'\n \nCommunity: \n'+community+'\n \nRRC: \n'+rrc+'\n\nTarget prefix: \n'+tPrefix+' \n\nN. of BGP routes observed at that time: '+nRoutes+' \n\nDate => '+dateSecond+'\n \n \nRETRIEVED DATA:\n \nSECOND ASPATH is \n'+ aspathSecond +'\n \nCommunity: \n' +communitySecond);
  }))
  .catch((e) => {
    if(e.code === 'ENOTFOUND'){
      console.log('Unable to connect to API servers');
    } else {
      console.log(e.message);
    }
  });
}
