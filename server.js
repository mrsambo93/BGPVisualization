const express = require('express');
const app = express();
var fs  = require("fs");
var bodyParser = require('body-parser');
const morgan = require('morgan');
require('dotenv').config();
var NodeGeocoder = require('node-geocoder');

app.use(morgan('tiny'));
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
  res.sendFile(__dirname + '/prima_visualizzazione.html');
});

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
    a(as_list, function(aspathcompleto) {
        var result = {"response" : aspathcompleto};
        res.json(result);
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

function a(goods, callback) {
    //var aspath = ["3","6939","6505","27735","7049"];

    //var aspath = ["24","2153","38040","23969"];

    var aspath = goods;
    aspath.reverse();

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



function calculateNewPath(aspathUno,aspathDue){
//  var i;
//  var j;
  var k;
  var newPath = [];
  item = {};
  item["asn"]=aspathUno[0].asn;
  item["x"]=0;
  item["y"]=0;
  newPath.push(item);
  console.log("1.Guarda ho appena inserito "+ item.asn);
  /*
  for (var cc = 0; cc<aspathDue.length; cc++){
    console.log("Ciao sono il primo|"+aspathDue[cc].asn+" | "+aspathDue[cc].x+" | "+aspathDue[cc].y);
  }

  for (var bb = 0; bb<aspathDue.length; bb++){
    console.log("Ciao sono il primo|"+aspathUno[bb].asn+" | "+aspathUno[bb].x+" | "+aspathUno[bb].y);
  }
*/
  for (var j=1;j<aspathDue.length;j++){
    console.log("La passata N."+j);
    var trovato = false;
    var coordinataLibera = false;

    for (var i=1;i<aspathUno.length && !trovato; i++){
      console.log("-Sottopassata N."+j+"."+i)
      console.log(aspathUno[i].asn == aspathDue[j].asn);

      if(aspathUno[i].asn == aspathDue[j].asn ){
      //  for (var bb = 0; bb<aspathDue.length; bb++){
      //    console.log("Ciao sono il"+bb+"|"+aspathUno[bb].asn+" | "+aspathUno[bb].x+" | "+aspathUno[bb].y);
      //  }
        //console.log("aspath2 asn = "+aspathDue[j].asn +". aspath1 asn ="+(aspathUno[i].asn));

        item = {};
        item["asn"]=aspathUno[i].asn;
        item["x"]=aspathUno[i].x;
        item["y"]=aspathUno[i].y;
        newPath.push(item);
        console.log("2.Guarda ho inserito"+item.asn);
        trovato = true;

      }
      if(!trovato && i==aspathDue.length-1){
        //console.log("Ciao sono dentro");
        item = {};

        if(aspathDue[j] != null){
          item["asn"]=aspathDue[j].asn;

          //console.log("Ciao sono il: ------"+item.asn);
          //Controllo se la coordinata (x,y) è libera
          for (k=1; k<aspathUno.length && !coordinataLibera; k++){
            if ((aspathDue[j].x == aspathUno[k].x) && (aspathDue[j].y == aspathUno[k].y)){
              item["x"]=aspathUno[k].x;
              item["y"]=aspathUno[k].y + 0.5;
              newPath.push(item);

              console.log("3.Guarda ho inserito"+item.asn);
              coordinataLibera = true;
              trovato = true
            }
            if(!coordinataLibera && k==aspathUno.length-1){

              var asnXX = newPath.length-1;
              item["x"]=aspathDue[j].x;
              item["y"]=aspathDue[j].y;
              newPath.push(item);
              console.log("4.Guarda ho inserito"+item.asn)
              coordinataLibera = true;
              trovato = true;
            }
          }
      }
    }
  }
  }
return newPath;
}
