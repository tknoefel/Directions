console.log('Simply.js demo!');

simply.on('singleClick', function(e) {
  console.log(util2.format('single clicked $button!', e));
  simply.subtitle('Pressed ' + e.button + '!');
});

simply.on('longClick', function(e) {
  console.log(util2.format('long clicked $button!', e));
  simply.vibe();
  simply.scrollable(e.button !== 'select');
});

simply.on('accelTap', function(e) {
  console.log(util2.format('tapped accel axis $axis $direction!', e));
  simply.subtitle('Tapped ' + (e.direction > 0 ? '+' : '-') + e.axis + '!');
});

simply.text({
  title: 'Simply Demo!',
  body: 'This is a demo. Press buttons or tap the watch!',
}, true);

simply.text({
  title:"Transit", 
  subtitle:"Direct", 
  body:"Loading..." });

var DESTINATIONS = [{ "short":"Work", "full":"Your Address Here" } ]; //more destinations here 
var API_KEY = "YOUR API KEY HERE";
var directionsData = null; 
var origin = null;
var depth = 0; 
var nodes = [0,0,0]; //Destination, Route, Step 
var networkSemiphore = false; 
var buttons = { back:false, up:true, select:true, down:true };
function apiUrlWithParams(){ 
  return "https://maps.googleapis.com/maps/api/directions/json?origin=" + origin +
          "&destination=" + DESTINATIONS[nodes[0]].full.replace(/ /g,"+") + 
          "&sensor=false&key=" + API_KEY + 
          "&mode=transit&alternatives=true&departure_time=" + Math.floor(Date.now()/1000); }

simply.on('singleClick', function(e) { 
  if(!networkSemiphore){ 
    if(e.button == 'up'){ decSelection(); } 
    if(e.button == 'down'){ incSelection(); } 
    if(e.button == 'select'){ 
      if(depth === 0 || goodData()){ 
        depth = Math.min(depth+1,2); //2 is the maximum depth 
        buttons.back = true; 
        simply.buttonConfig(buttons); } } 
    if(e.button == 'back'){ 
      nodes[depth] = 0;
      depth = Math.max(depth-1,0); 
      if(depth === 0) { init(); } } geoFetchAndDraw(); } });

function goodData(){ 
  return directionsData.status == "OK"; }

function incSelection(  ){ 
  var max = 0; 
  switch(depth){ 
    case 0: max = DESTINATIONS.length - 1; break; 
    case 1: if(goodData()){ max = directionsData.routes.length - 1; } break; 
    case 2: if(goodData()){ max = directionsData.routes[nodes[1]].legs[0].steps.length - 1; } break; } 
  nodes[depth] = Math.min(nodes[depth]+1, max); }

function decSelection(){ 
  nodes[depth] = Math.max(nodes[depth]-1, 0); }

function draw(){ 
  try{ 
    switch(depth){ 
      case 0: 
        simply.text({title:'Pick Destination:', subtitle:DESTINATIONS[nodes[0]].short, body:DESTINATIONS[nodes[0]].full}); 
        break; 
      case 1: 
        if(goodData()){ simply.text(routeText()); } 
        else{ simply.text(errorText()); } 
        break; 
      case 2: 
        if(goodData()){ simply.text(stepText()); } 
        else{ simply.text(errorText()); } 
        break; 
      default: 
        simply.text({title:"Level not implemented yet.",subtitle:"depth:" + depth,body:"selection:" + nodes[depth]}); 
        break; 
    } } 
  catch(error){  console.log(error); init(); draw(); } } //something happened. Return to regular state.
    
function stepText(){ 
  console.log("steptext"); 
  var step = directionsData.routes[nodes[1]].legs[0].steps[nodes[2]]; 
  var t = ""; 
  var st = ""; 
  var b = ""; 
  console.log(step.travel_mode); 
  switch(step.travel_mode){ 
    case "WALKING": 
      t = "Walk " + step.distance.text; 
      b = step.html_instructions.replace(/<[>]*>?/gm, ''); //strips HTML tags which may appear. 
      break; 
    case "TRANSIT": 
      var details = step.transit_details; 
      t = details.line.vehicle.name + " " + details.line.short_name; 
      st = details.headsign; 
      b = details.num_stops + " stops\n" + details.departure_stop.name + " " + details.departure_time.text + "\n" + details.arrival_stop.name + " " + details.arrival_time.text; 
      break; 
    default: 
      t = "Unsupported Mode"; 
      st = step.travel_mode; 
      break; } 
  return {title:t,subtitle:st,body:b}; }

function routeText(){ 
  var mainStep = mainStepInRoute(); 
  var t, b; 
  var leg = directionsData.routes[nodes[1]].legs[0]; 
  switch(mainStep.travel_mode){ 
    case "WALKING": 
      t = "Walk " + mainStep.distance.text; 
      b = leg.duration.text; 
      break; 
    case "TRANSIT": 
      var details = mainStep.transit_details; 
      t = details.line.vehicle.name + " " + details.line.short_name; 
      b = leg.departure_time.text + " - " + leg.arrival_time.text + "\n" + leg.duration.text; 
      break; 
    default: 
      t = "Unsupported Mode"; 
      break; } //TODO: Uncommment for release //b = b + "\n" + directionsData.routes[nodes[1]].copyrights; 
  var st = leg.steps.length + " steps"; 
  return {title:t,subtitle:st,body:b}; }
  
function errorText(){ var t = ""; var st = ""; var b = ""; console.log(directionsData.status); switch(directionsData.status){ case "OK": t = "Everything is fine."; break; case "NOT_FOUND": t = "destination not found"; break; case "ZERO_RESULTS": t = "No results"; b = "It may be impossible to get to " + DESTINATIONS[nodes[0]].short + " from where you are."; break; case "INVALID_REQUEST": t = "Invalid Request"; break; case "OVER_QUERY_LIMIT": t = "Over Query Limit"; b = "Wait or switch API Key in the script"; break; case "REQUEST_DENIED": t = "Request Denied"; break; case "UNKNOWN_ERROR": t = "Unknown Error"; st = "Google Fail"; b = "Try again?"; break; default: t = "Unkown Status Code"; b = directionsData.status; break; } return {title:t, subtitle:st, body:b}; }


                     
function mainStepInRoute(){ var leg = directionsData.routes[nodes[1]].legs[0]; for(var i = 0; i < leg.steps.length; i++){ if(leg.steps[i].travel_mode == "TRANSIT"){ return leg.steps[i]; } } return leg.steps[0]; }
function geoFetchAndDraw(){ if(depth !== 0 && origin === null){ simply.text({title:"Getting GPS...",subtitle:"",body:""}); networkSemiphore = true; navigator.geolocation.getCurrentPosition(function(position){ origin = position.coords.latitude + "," + position.coords.longitude; fetchAndDraw(); }, function(error){ console.log("Could not get GPS location."); simply.text({title:"Could not get GPS.",subtitle:"",body:"Press Back."}); }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 } ); } else{ console.log("Skipping GPS fetch."); fetchAndDraw(); } }
function fetchAndDraw(){ if(depth !== 0 && directionsData === null){ networkSemiphore = true; simply.text({title:"Getting Directions...",subtitle:"",body:""}); console.log(apiUrlWithParams()); ajax({ url: apiUrlWithParams(), type: 'json' }, function(data) { directionsData = data; networkSemiphore = false; draw(); },function(error){ simply.text({title:"Could not get directions.",subtitle:"",body:"Press Back."}); }); } else{ console.log("Skipping Directions fetch."); networkSemiphore = false; draw(); } }
function init(){ depth = 0; nodes = [nodes[0],0,0]; directionsData = null; origin = null; buttons.back = false; simply.buttonConfig(buttons); }
//Called on start init(); draw();