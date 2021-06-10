let originCoords, originAddress, destinationCoords, destinationAddress;
let ETAArray = []
let cityNames = new Map();
let numOfCities = 0
let tripWeatherTimeLine = new Map();
let tripETATimeLine = [];
let tripDuration;
var map
let markers = []
let cors = 'https://limitless-castle-15768.herokuapp.com/'
let to = "DEFAULT_END"
let from = "DEFAULT_START"
let googleKey = "YOUR GOOGLE API KEY"
let weatherKey = "YOUR OPENWEATHER API KEY"
document.getElementsByClassName('loadingcontainer')[0].style.display = 'none'

const icons = {
    start: {
    icon: "icons/start.svg",
    },
    end: {
    icon: "icons/end.svg",
    },
    mark: {
    icon: "icons/map-marker.png",
    },
}

const weather_icons = {
    '01d': 'icons/01d.png',
    '01n': 'icons/01n.png',
    '02d': 'icons/02d.png',
    '02n': 'icons/02n.png',
    '03d': 'icons/03d.png',
    '03n': 'icons/03n.png',
    '04d': 'icons/03d.png',
    '04n': 'icons/03n.png',
    '09d': 'icons/09d.png',
    '09n': 'icons/09n.png',
    '10d': 'icons/10d.png',
    '10n': 'icons/10n.png',
    '11d': 'icons/11d.png',
    '11n': 'icons/11n.png',
    '13d': 'icons/13d.png',
    '13n': 'icons/13n.png',
    '50d': 'icons/50d.png',
    '50n': 'icons/50n.png',
}

$(document).ready(function() {
var coords = { lat: 40.7125428, lng: -74.0098051 };
var mapOptions = {
    center: coords,
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false

};

map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);
var directionsDisplay = new google.maps.DirectionsRenderer();
directionsDisplay.setMap(map);
var infowindow = new google.maps.InfoWindow();
var directions = new google.maps.DirectionsService();
var renderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    suppressPolylines: true,
    infoWindow: infowindow,
});

$(".submit-form").click(() => {
    route();
});

function route() {
    var request = {
        origin: document.getElementById("from").value,
        destination: document.getElementById("to").value,
        travelMode: google.maps.TravelMode.DRIVING, //WALKING, BICYCLING, TRANSIT
        unitSystem: google.maps.UnitSystem.IMPERIAL,
    }
    if (request.origin == from && request.destination == to) {
        alert("Please change the origin or destination for new directions.")
        return
    } else if (!request.origin || !request.destination) {
        alert("Please add both a origin and destination for directions.")
        return
    }
    from = request.origin
    to = request.destination
    originCoords = 0;
    originAddress = 0;
    destinationCoords = 0;
    destinationAddress = 0;
    ETAArray = []
    cityNames = new Map();
    numOfCities = 0
    tripWeatherTimeLine = new Map();
    tripETATimeLine = [];
    if (markers.length > 0) {
        clearMarkers();
    }
    document.getElementsByClassName('loadingcontainer')[0].style.display = 'block'
    directions.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            renderer.setDirections(response);
            renderer.setMap(map);
            renderDirectionsPolylines(response);

            getDirections(renderer.getDirections(response))
        } else {
            renderer.setMap(null);
            alert("Sorry you can't drive between these 2 places.")
            document.getElementsByClassName('loadingcontainer')[0].style.display = 'none'
            return
        }
    });
}
var polylineOptions = {
    strokeColor: '#7e96f6',
    strokeOpacity: 0.75,
    strokeWeight: 8
};
var polylines = [];
function renderDirectionsPolylines(response) {
    for (var i=0; i<polylines.length; i++) {
      polylines[i].setMap(null);
    }
    var legs = response.routes[0].legs;
    for (i = 0; i < legs.length; i++) {
        var steps = legs[i].steps;
        for (j = 0; j < steps.length; j++) {
            var nextSegment = steps[j].path;
            var stepPolyline = new google.maps.Polyline(polylineOptions);
            for (k = 0; k < nextSegment.length; k++) {
            stepPolyline.getPath().push(nextSegment[k]);
            }
            polylines.push(stepPolyline);
            stepPolyline.setMap(map);
            google.maps.event.addListener(stepPolyline, 'click', function(evt) {
                document.getElementsByClassName('loadingcontainer')[0].style.display = 'block'
                asyncETACall(evt.latLng.toUrlValue(6));
            })
        }
    }
}

var input1 = document.getElementById("from");
var autocomplete1 = new google.maps.places.Autocomplete(input1);
var input2 = document.getElementById("to");
var autocomplete2 = new google.maps.places.Autocomplete(input2);
});

function getDirections (data) {
    let directions;
    totalTripDuration = data.routes[0].legs[0].duration
    tripDuration = toMins(data.routes[0].legs[0].duration.text)
    data = data.routes[0].legs[0]
    directions = data.steps
    originCoords = data.start_location
    originAddress = data.start_address
    destinationCoords = data.end_location
    destinationAddress = data.end_address
    coordsToTowns(directions)
    return
}

function clearMarkers() {
    for(i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = []
    return
}

function coordsToTowns (directions) {
    let marker = new google.maps.Marker({
        position: new google.maps.LatLng(destinationCoords.lat(), destinationCoords.lng()),
        map: map,
        icon: {
            size: new google.maps.Size(30, 30),
            scaledSize: new google.maps.Size(30, 30),
            url: icons['end'].icon,
            anchor: new google.maps.Point(0, 30),
        },
        id: 'end',
    });
    google.maps.event.addListener(marker, 'click', function(){
        getWeather('end')
        return
    });
    markers.push(marker)
    weatherAPICall ([-20, destinationAddress, destinationCoords.lat(), destinationCoords.lng()])
    marker = new google.maps.Marker({
        position: new google.maps.LatLng(originCoords.lat(), originCoords.lng()),
        map: map,
        icon: {
            size: new google.maps.Size(30, 30),
            scaledSize: new google.maps.Size(30, 30),
            url: icons['start'].icon,
        },
        id: 'start',
    });
    google.maps.event.addListener(marker, 'click', function(){
        getWeather('start')
        return
    });
    markers.push(marker)
    weatherAPICall ([-10, originAddress, originCoords.lat(), originCoords.lng()])
    sortETA();
    const promises = [];
    for (let i = 0; i < directions.length; i++) {
        if (i == 0) {
            ETAArray.push(toMins(directions[i].duration.text))
        } else {
            ETAArray.push(toMins(directions[i].duration.text) + ETAArray[ETAArray.length - 1])
        }
        numOfCities++;
        promises.push(getCity(directions[i].end_location.lat(), directions[i].end_location.lng(), i));
    }
    Promise.all(promises)
    .then(() => removeDuplicates());
    return
}

function removeDuplicates () {
    let citySet = new Set()
    for (i = 0; i < numOfCities; i++) {
        if (citySet.has(cityNames.get(i)[1])) {
            cityNames.delete(i)
        } else {
            citySet.add(cityNames.get(i)[1])
        }
    }
    getWeatherForecast(cityNames, true)
    return
}

async function asyncETACall (coords) {
    let request = cors + 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=' + originCoords.lat() + ',' + originCoords.lng() + '&destinations=' + coords + '&key=' + googleKey
    let data = await fetch(request);
    let json = await data.json();
    if (typeof json !== 'undefined') {
        getWeatherForecast([json,coords], false);
    }
    return
}

async function getCity (lat, lng, i) {
    let request = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=' + googleKey
    let data = await fetch(request);
    let json = await data.json();
    let city
    if (typeof json !== 'undefined') {
        if (json.plus_code.compound_code) {
            city = json.plus_code.compound_code.split(/ (.+)/)[1]
        } else {
            city = json.results[0].formatted_address.split(', ')
            city = city[0] + ', ' + city[1] + ', ' + city[2].split(' ')[0] + ', ' + city[3]
        }
        cityNames.set(i, [i, city, lat, lng])
        return
    }
}

function getWeatherForecast (cities, group) {
    const promises = [];
    if (group) {
        for (let i = 0; i < numOfCities; i++) {
            if (cities.has(i)) {
                promises.push(weatherAPICall(cities.get(i)))
            }
        }
    } else {
        let n = -1
        let city = cities[0].destination_addresses[0].split(', ')
        city = city[1] + ', ' + city[2].split(' ')[0] + ', ' + city[3]
        let lat = parseFloat(cities[1].split(',')[0])
        let lng = parseFloat(cities[1].split(',')[1])
        let opt = toMins(cities[0].rows[0].elements[0].duration.text)

        let request = [n, city, lat, lng, opt]
        promises.push(weatherAPICall(request))
    }
    Promise.all(promises)
    .then(() => sortETA());
    return
}

function sortETA () {
    tripETATimeLine.sort(function(a, b) {
        return a - b;
    });
    renderTrip()
    return
}

function renderTrip () {
    for (i = 0; i < tripETATimeLine.length; i++) {
        let coords = tripWeatherTimeLine.get(tripETATimeLine[i])[0]
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(coords[2], coords[3]),
            map: map,
            icon: {
                size: new google.maps.Size(10, 10),
                scaledSize: new google.maps.Size(10, 10),
                url: icons['mark'].icon,
                anchor: new google.maps.Point(5, 5),
            },
            id: tripETATimeLine[i],
        });
        google.maps.event.addListener(marker, 'click', 
        function(){
            getWeather(marker.id)
            return
        });
        markers.push(marker)
    }
    document.getElementsByClassName('loadingcontainer')[0].style.display = 'none'
    getWeather('end')
    return
}

function getWeather (id) {
    let forecast = tripWeatherTimeLine.get(id)
    let ETA
    let hourly = true
    let currentTime = parseInt(Date.now()/1000)
    let targetTime = currentTime
    let targetForecast
    if (forecast)  {
        let townName = forecast[0][1]
        if (id == 'end') {
            ETA = Math.round(tripDuration/60)
            id = tripDuration
        } else if (id == 'start') {
            ETA = 0
            id = 0
        } else {
            ETA = Math.round(id/60)
        }
        let departureTime = parseInt(document.getElementById("appt").value.split(":")[0])*3600 + parseInt(document.getElementById("appt").value.split(":")[1])*60
        if (!isNaN(departureTime)) {
            let date = new Date()
            date.setHours(0,0,0,0);
            date = date.getTime() / 1000
            id += departureTime/3600
            departureTime += date
            if (departureTime < currentTime) {
                departureTime += 86400
            }
            departureTime = Math.round((departureTime - currentTime) / 3600)
            ETA += departureTime
        }
        if (ETA > 47) {
            hourly = false
        }
        targetTime += ETA
        if (hourly) {
            targetForecast = forecast[1].hourly[ETA]
            let day = false
            if (targetForecast.weather[0].icon[2] == 'd') {
                day = true
            }
            forecast = {
                town_name: townName,
                temp: targetForecast.temp,
                feels_like: targetForecast.feels_like,
                visibility: targetForecast.visibility,
                weather_description: targetForecast.weather[0].description,
                icon: weather_icons[targetForecast.weather[0].icon],
                arrival_time: toETA(ETA*60),
                is_day: day
            }
            let forecastHTML = "<div id = \"left\"><h1 id=\"forecast-city\">" + 
            forecast.town_name + 
            "</h1><line class=\"line\"><p style=\"display:inline\" id=\"forecast-description\">" + 
            capitalizeFirstLetter(forecast.weather_description) + 
            "</p> <p style=\"display:inline\"></p> <p style=\"display:inline\" id=\"forecast-eta\">" + 
            forecast.arrival_time + 
            "</p></line><br><br><line class=\"line\"><p style=\"display:inline\">Feels like </p> <p style=\"display:inline\" d=\"forecast-feels-like\">" + 
            forecast.feels_like + 
            " F°</p></line><br><br><line class=\"line\"><p style=\"display:inline\">Visibility: </p><p style=\"display:inline\" id=\"forecast-visibility\">" + 
            forecast.visibility + 
            "</p> <p style=\"display:inline\">meters</p></line></div><div id = \"right\"><div><p id=\"forecast-temp\">" + 
            forecast.temp + 
            " F°</p></div><div><img id=\"forecast-icon\" src=\"" + 
            forecast.icon + 
            "\"></div></div>"
            let weatherBox = document.getElementsByClassName("wrapper-right")[0]
            weatherBox.innerHTML = forecastHTML
            if (!forecast.is_day) {
                document.getElementById("forecast-city").style.color="white";
                document.getElementById("forecast-temp").style.color="white";
                document.getElementsByClassName("line")[0].style.color="white";
                document.getElementsByClassName("line")[1].style.color="white";
                document.getElementsByClassName("line")[2].style.color="white";

                weatherBox.style.backgroundImage="linear-gradient(to bottom right, #2c2691, #f1f0ff)";
            } else {
                weatherBox.style.backgroundImage="linear-gradient(to bottom right, #e9f7ff, #9ed7ff)";
            }
        } else {
            ETA = ETA/24 + 1
            if (ETA > 8) {
                ETA = 7.0
            }
            let day = true
            if (ETA - parseInt(ETA) > 0.5) {
                day = false
            }
            ETA = parseInt(ETA)
            targetForecast = forecast[1].daily[ETA]
            if (day) {
                forecast = {
                    town_name: townName,
                    temp: targetForecast.temp.day,
                    feels_like: targetForecast.feels_like.day,
                    weather_description: targetForecast.weather[0].description,
                    icon: weather_icons[targetForecast.weather[0].icon],
                    arrival_time: toETA((ETA-1)*1440),
                    is_day: true
                }
            } else {
                forecast = {
                    town_name: townName,
                    temp: targetForecast.temp.night,
                    feels_like: targetForecast.feels_like.night,
                    weather_description: targetForecast.weather[0].description,
                    icon: weather_icons[targetForecast.weather[0].icon],
                    arrival_time: toETA((ETA-1)*1440),
                    is_day: false
                }
            }
            let forecastHTML = "<div id = \"left\"><h1 id=\"forecast-city\">" + 
            forecast.town_name + 
            "</h1><line class=\"line\"><p style=\"display:inline\" id=\"forecast-description\">" + 
            capitalizeFirstLetter(forecast.weather_description) + 
            "</p> <p style=\"display:inline\"></p> <p style=\"display:inline\" id=\"forecast-eta\">" + 
            forecast.arrival_time + 
            "</p></line><br><br><line class=\"line\"><p style=\"display:inline\">Feels like </p> <p style=\"display:inline\" d=\"forecast-feels-like\">" + 
            forecast.feels_like + 
            " F°</p></line><br><br></div><div id = \"right\"><div><p id=\"forecast-temp\">" + 
            forecast.temp + 
            " F°</p></div><div><img id=\"forecast-icon\" src=\"" + 
            forecast.icon + 
            "\"></div></div>"
            let weatherBox = document.getElementsByClassName("wrapper-right")[0]
            weatherBox.innerHTML = forecastHTML
            if (!forecast.is_day) {
                document.getElementById("forecast-city").style.color="white";
                document.getElementById("forecast-temp").style.color="white";
                document.getElementsByClassName("line")[0].style.color="white";
                document.getElementsByClassName("line")[1].style.color="white";
                document.getElementsByClassName("line")[2].style.color="white";
                weatherBox.style.backgroundImage="linear-gradient(to bottom right, #2c2691, #f1f0ff)";
            } else {
                weatherBox.style.backgroundImage="linear-gradient(to bottom right, #e9f7ff, #9ed7ff)";
            }
        }
    }
    return
}

async function weatherAPICall (location) {
    let request = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + location[2] + '&lon=' + location[3] + '&units=imperial&exclude=minutely&appid=' + weatherKey
    let data = await fetch(request);
    let json = await data.json();
    if (typeof json !== 'undefined') {
        if (location[0] == -1) {
            tripWeatherTimeLine.set(location[4], [location, json])
            tripETATimeLine.push(location[4])
        } else if (location[0] == -10) {
            tripWeatherTimeLine.set('start', [location, json], 0)
        } else if (location[0] == -20) {
            tripWeatherTimeLine.set('end', [location, json, tripDuration])
        } else {
            tripWeatherTimeLine.set(ETAArray[location[0]], [location, json])
            tripETATimeLine.push(ETAArray[location[0]])
        }
    }
    return
}

function toMins (duration) {
    let mins = 0;
    let components = duration.split(" ");
    for (i = 0; i < components.length; i++) {
        if (components[i] == 'day' || components[i] == 'days') {
            mins += 1440*parseInt(components[i-1])
        } else if (components[i] == 'hour' || components[i] == 'hours' || components[i] == 'hr') {
            mins += 60*parseInt(components[i-1])
        } else if (components[i] == 'minute' || components[i] == 'minutes' || components[i] == 'min' || components[i] == 'mins') {
            mins += parseInt(components[i-1])
        }
    }
    return mins;
}

function toETA (ETA) {
    if (ETA == 0) {
        return "within the next hour"
    }
    let days = Math.floor(ETA/24/60)
    let hours = Math.floor(ETA/60%24)
    let minutes = Math.floor(ETA%60) 
    if (days > 0 && hours > 0 && minutes > 0) {
        return "in about " +days + " days, " + hours + " hours and " + minutes + " minutes"
    } else if (days > 0 && hours > 0 && minutes < 1) {
        return "in about " +days + " days and " + hours + " hours"
    } else if (days > 0 && hours < 1) {
        return "in about " +days + " days"
    } else if (days < 1 && hours > 0 && minutes > 0) {
        return "in about " +hours + " hours and " + minutes + " minutes"
    } else if (days < 1 && hours > 0 && minutes < 1) {
        return "in about " +hours + " hours"
    } else if (days < 1 && hours < 1 && minutes > 0) {
        return "in about " +minutes + " minutes"
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}