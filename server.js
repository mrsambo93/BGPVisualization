const express = require('express')
const app = express()
var fs  = require("fs")
var bodyParser = require('body-parser');
const morgan = require('morgan')

app.use(morgan('tiny'));
app.use(bodyParser.json()); 
//app.use(express.static(__dirname + '/scripts'))

var port = process.env.PORT || 8080;

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/prima_visualizzazione.html');
});

app.post('/aspath', function(req, res) {
    var as_list = req.body.aspath;
    a(as_list, function(aspathcompleto) {
        var result = { "response" : aspathcompleto};
        res.json(result); 
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