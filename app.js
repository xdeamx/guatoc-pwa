$(document).ready(function() {

    const map = L.map('app').fitWorld();
    var onLine = true;
    globalLatitude = null;
    globalLongitude = null;
    places_points = [];
    currentPosition = null;



    // check the connection state when the last page is loaded
    window.addEventListener('load', function() {
        if (navigator.onLine) {
            console.log('Conectado a Internet');
            onLine = true;

        } else {
            console.log('Desconectado de Internet');
            onLine = false;
            $("#offlinecontainer").css("display", "block");
            getLocation();
        }
    });

    // check the changes of the connection
    window.addEventListener('online', function() {
        console.log('Conectado a Internet');
        onLine = true;

        $("#offlinecontainer").css("display", "none");

        getLocation();
    });

    window.addEventListener('offline', function() {
        console.log('Desconectado de Internet');
        onLine = false;

        $("#offlinecontainer").css("display", "block");

        getLocation();
    });

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('action')) {
        if (urlParams.get('action') == "new-place") {
            displayMessage("success", "server", "place");
        }
    }



    // Function to get the current location
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            document.getElementById("location").innerHTML = "Debe encender y dar permisos de geolocalización a la aplicación.";
        }

        if ((localStorage.getItem("placesToSave") || localStorage.getItem("evidencesToSave")) && onLine) {
            $("#pendingInfoToSync").css("display", "block");
        } else {
            $("#pendingInfoToSync").css("display", "none");
        }


    }

    // Function to display the current position
    function showPosition(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        globalLatitude = position.coords.latitude;
        globalLongitude = position.coords.longitude;
        document.getElementById("location").innerHTML = "Las coordenadas de su ubicacion actual son Latitud: " + latitude + "y Longitud: " + longitude;
        if (currentPosition == null) {
            currentPosition = L.marker([latitude, longitude]).addTo(map)
                .bindPopup(`Tu te encuentras en este lugar.`).openPopup();
        } else {
            var newLatLng = new L.LatLng(latitude, longitude);
            currentPosition.setLatLng(newLatLng);
        }




    }



    function isInTolerance(latitude, longitude, referenceLatitude, referenceLongitude, tolerance) {
        // Calculate the differences between the coordinates and the reference point
        var latitudeDiff = Math.abs(latitude - referenceLatitude);
        var longitudeDiff = Math.abs(longitude - referenceLongitude);

        // Check if both differences are within the tolerance range
        return latitudeDiff <= tolerance && longitudeDiff <= tolerance;
    }

    // Call the function to get the current location
    getLocation();



    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    function onLocationFound(e) {
        const radius = e.accuracy / 2;

        //const locationMarker = L.marker(e.latlng).addTo(map)
        //  .bindPopup(`You are within ${radius} meters from this point`).openPopup();

        // const locationCircle = L.circle(e.latlng, radius).addTo(map);
    }

    function onLocationError(e) {
        Swal.fire({
            icon: "error",
            title: "Geolocalización deshabilitada",
            text: "Para usar el aplicativo debe habilitar su geolocalización"
        });

    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({
        setView: true,
        maxZoom: 16
    });


    $.getJSON("points.json?value=" + Date.now(), function(data) {
        // Display JSON data on the page
        var jsonData = JSON.stringify(data, null, 2); // Convert JSON object to formatted string
        console.log(data);
        data = Object.keys(data).map(key => data[key]);


        for (var i = 0; i < data.length; i++) {

            places_points.push({
                date: data[i].date,
                name: data[i].name,
                latitude: data[i].latitude,
                longitude: data[i].longitude,
                description: data[i].description,
                id: data[i].id
            })


        }
        // Call the function to create timeline items
        displayPointsLocations(places_points);

        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('detail-view')) {
            const itemstoCheck = $(".item-actions .btn");
            for (var i = 0; i < itemstoCheck.length; i++) {
                if ($($(".item-actions .btn")[i]).attr("data-location") == urlParams.get('detail-view')) {
                    $($(".item-actions .btn")[i]).click();
                    displayMessage("success", "server", "evidence");
                }
            }
        }
        checkLocalStorage();


    }).fail(function() {
        checkLocalStorage();
    });


    function checkLocalStorage() {

        arrayPlaces = [];
        // get the JSON info from the local storage
        var dataJSON = localStorage.getItem('placesToSave');



        if (dataJSON) {
            // transform the JSON to an array objects
            arrayPlaces = JSON.parse(dataJSON);
            for (var i = 0; i < arrayPlaces.length; i++) {
                var div = document.createElement('div');
                div.className = "item-place";
                div.innerHTML = '<div class="item-title"><strong> Guardado localmente. Pendiente de sincronizar</strong><p><span class="iconmap"></span>' + arrayPlaces[i].name + '</p></div><div class="item-actions _view-detail"><button class="btn" data-location="' + arrayPlaces[i].tempId + '">Ver</button></div>';
                var listPlaces = document.getElementById('list_places');
                listPlaces.appendChild(div);
                var marker = L.marker([arrayPlaces[i].latitude, arrayPlaces[i].longitude]).addTo(map);
                marker._icon.classList.add("huechange");
                places_points.push(arrayPlaces[i]);

            }
        }


    }

    function getEvidencesByPoint() {
        $.getJSON("data.json?value=" + Date.now(), function(data) {
            // Display JSON data on the page
            var jsonData = JSON.stringify(data, null, 2); // Convert JSON object to formatted string
            console.log(data);
            data = Object.keys(data).map(key => data[key]);
            timelineData = [];
            var tolerance = 0.1; // Tolerance range in degrees
            for (var i = 0; i < data.length; i++) {
                if (isInTolerance(data[i].latitude, data[i].longitude, globalLatitude, globalLongitude, tolerance)) {
                    timelineData.push({
                        date: data[i].date,
                        event: data[i].image,
                        description: data[i].description,
                    })
                }

            }
            // Call the function to create timeline items
            createTimelineItems();
        });
    }


    $(document).on("click", ".addInformation", function() {
        console.log("agregar...");
        $("#form").css("display", "block");

        var latitude = this.getAttribute("data-latitude");
        var longitude = this.getAttribute("data-longitude");

        $("#latitude").val(latitude);
        $("#longitude").val(longitude);
    });

    $(document).on("click", "._view-detail", function(e) {
        e.preventDefault();
        $("#container").find(".page").addClass("_hideform");
        var idPoint = $(e.currentTarget).find("button").attr("data-location");
        $("#detailpoint").removeClass("_hideform");
        var timeline = document.getElementById('timeline');
        timeline.innerHTML = ''; // Clear existing content

        if (localStorage.getItem("evidencesToSave")) {
            arrayEvidences = [];
            // get the JSON info from the local storage
            var dataJSON = localStorage.getItem('evidencesToSave');

            if (dataJSON) {
                // transform the JSON to an array objects
                arrayEvidences = JSON.parse(dataJSON);
                for (var i = 0; i < arrayEvidences.length; i++) {
                    if (idPoint.toString() == arrayEvidences[i].evidenceidPlace.toString()) {
                        var li = document.createElement('li');
                        li.innerHTML = '<div><strong> Registrado localmente. Pendiente sincronizar al servidor' + '</strong>' +
                            '<p>' + arrayEvidences[i].evidenceDescription + '</p><p><img src="' + arrayEvidences[i].image + '" class="img-timeline"></img></p></div>';
                        timeline.appendChild(li);

                    }

                }
            }
        }

        if (onLine) {
            $.getJSON("evidences/" + idPoint + ".json?value=" + Date.now(), function(data) {
                    // Display JSON data on the page
                    var jsonData = JSON.stringify(data, null, 2); // Convert JSON object to formatted string
                    data.forEach(function(item) {
                        var li = document.createElement('li');
                        li.innerHTML = '<div><strong>' + item.date + '</strong>' +
                            '<p>' + item.description + '</p><p><img src="uploads/' + item.image + '" class="img-timeline"></img></p></div>';
                        timeline.appendChild(li);
                    });
                    displayPlaceDetail(idPoint);


                }).done(function() {
                    console.log("second success");
                })
                .fail(function() {
                    console.log("error");

                    if (timeline.innerHTML == "") {
                        timeline.innerHTML = ''; // Clear existing content

                        var li = document.createElement('li');
                        li.innerHTML = '<p>No tiene evidencias registradas.</p>';
                        timeline.appendChild(li);
                    }
                    displayPlaceDetail(idPoint);

                });
        } else {
            displayPlaceDetail(idPoint);
        }



    });


    $("._addPlace").click(function(e) {
        e.preventDefault();
        $("#container").find(".page").addClass("_hideform");
        $("#form_addpoint").removeClass("_hideform");
        $("#name").val("");
        $("#description").val("");
    });

    $("._addEvidence").click(function(e) {
        e.preventDefault();
        $("#container").find(".page").addClass("_hideform");
        $("#form_addregister").removeClass("_hideform");

        $("#evidence-description").val("");
        $("#image").val("");

        $("#evidence-idPlace").val($("._addEvidence").attr("data-placedetailid"));

    });

    $("._returnHome").click(function(e) {
        e.preventDefault();
        $("#container").find(".page").addClass("_hideform");
        $("#home").removeClass("_hideform");

    });

    $("._returnDetail").click(function(e) {
        e.preventDefault();
        $("#container").find(".page").addClass("_hideform");
        $("#detailpoint").removeClass("_hideform");

    });




    $("._refreshPosition").click(function(e) {
        getLocation();
    });


    $(".btnSavePlace").click(function(e) {
        e.preventDefault();

        var fechaActual = new Date();

        // Obtener día, mes y año
        var dia = fechaActual.getDate();
        var mes = fechaActual.getMonth() + 1; // Nota: getMonth() devuelve valores de 0 a 11
        var anio = fechaActual.getFullYear();

        // Obtener horas, minutos y segundos
        var horas = fechaActual.getHours();
        var minutos = fechaActual.getMinutes();
        var segundos = fechaActual.getSeconds();


        const newPlace = {
            name: $("#name").val(),
            description: $("#description").val(),
            latitude: globalLatitude,
            longitude: globalLongitude,
            date: dia + "-" + mes + "-" + anio + " " + horas + ":" + minutos + ":" + segundos
        };

        if (newPlace.name == "" || newPlace.description == "") {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Diligencie todo el formulario"
            });
        } else {

            console.log(newPlace);

            if (onLine) {

                $.ajax({
                    type: 'POST',
                    url: 'processplace.php',
                    data: newPlace,
                    success: function(response) {
                        // Manejar la respuesta exitosa
                        console.log('¡Formulario enviado con éxito!');
                        console.log(response);
                        window.location = "index.html?action=new-place";

                    },
                    error: function(xhr, status, error) {
                        // Manejar errores
                        console.error('Error al enviar el formulario:', error);
                    }
                });

            } else {



                var arrayPlaces = [];
                // get the JSON info from the local storage
                var dataJSON = localStorage.getItem('placesToSave');

                if (dataJSON) {
                    // transform the JSON to an array objects
                    arrayPlaces = JSON.parse(dataJSON);

                    console.log('Datos recuperados del almacenamiento local:');
                    console.log(arrayPlaces);
                } else {
                    console.log('No se encontraron datos en el almacenamiento local.');


                }

                newPlace.tempId = -1 * ((arrayPlaces.length) + 1);

                arrayPlaces.push(newPlace);

                places_points.push(newPlace);


                dataJSON = JSON.stringify(arrayPlaces);

                // Guardar la cadena JSON en el almacenamiento local
                localStorage.setItem('placesToSave', dataJSON);
                var listPlaces = document.getElementById('list_places');

                var div = document.createElement('div');
                div.className = "item-place";
                div.innerHTML = '<div class="item-title"><strong> Guardado localmente. Pendiente de sincronizar</strong><p><span class="iconmap"></span>' + newPlace.name + '</p></div><div class="item-actions _view-detail"><button class="btn" data-location="' + newPlace.tempId + '">Ver</button></div>';
                listPlaces.appendChild(div);

                var myIcon = L.icon({
                    iconUrl: 'AppIcons/location.png',
                    iconSize: [40, 40],
                    iconAnchor: [22, 94],
                    popupAnchor: [-3, -76],
                });



                //var marker = L.marker([newPlace.latitude,newPlace.longitude],{icon: myIcon}).addTo(map);
                var marker = L.marker([newPlace.latitude, newPlace.longitude]).addTo(map);
                marker._icon.classList.add("huechange");
                $("._returnHome").click();
                displayMessage("success", "local", "place");
            }
        }


    });

    $(".send-class").click(function(e) {
        if (onLine) {
            console.log("It is online, continue saving...");
        } else {
            e.preventDefault();
            arrayEvidences = [];
            // get the JSON info from the local storage
            var dataJSON = localStorage.getItem('evidencesToSave');

            if (dataJSON) {
                // transform the JSON to an array objects
                arrayEvidences = JSON.parse(dataJSON);

                console.log('Datos recuperados del almacenamiento local:');
                console.log(arrayEvidences);
            } else {
                console.log('No se encontraron datos en el almacenamiento local.');


            }

            var input = document.getElementById('image');
            var file = input.files[0];
            var imagenBase64 = 0;

            if (file) {
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function(event) {
                    imagenBase64 = event.target.result;

                    var evidence = {
                        evidenceDescription: $("#evidence-description").val(),
                        evidenceidPlace: $("#evidence-idPlace").val(),
                        image: imagenBase64,
                    };

                    arrayEvidences.push(evidence);
                    dataJSON = JSON.stringify(arrayEvidences);

                    // Guardar la cadena JSON en el almacenamiento local
                    localStorage.setItem('evidencesToSave', dataJSON);
                    $("#container").find(".page").addClass("_hideform");
                    $("#detailpoint").removeClass("_hideform");
                    displayPlaceDetail(evidence.evidenceidPlace);

                    var timeline = document.getElementById('timeline');
                    timeline.innerHTML = ''; // Clear existing content
                    var li = document.createElement('li');
                    li.innerHTML = '<div><strong> Registrado localmente. Pendiente sincronizar al servidor' + '</strong>' +
                        '<p>' + evidence.evidenceDescription + '</p><p><img src="' + evidence.image + '" class="img-timeline"></img></p></div>';

                    timeline.insertBefore(li, timeline.firstChild);
                    displayMessage("success", "local", "evidence");
                };
            } else {
                console.error('No se ha seleccionado ningún archivo.');
            }




        }

    });

    $(".__discardInfo").click(function() {
        localStorage.removeItem('placesToSave');
        localStorage.removeItem('evidencesToSave');
        getLocation();

        Swal.fire({
            title: "Descatar cambios",
            text: "Se han descartado los cambios locales",
            icon: "success",
            showCancelButton: false,
            confirmButtonText: "OK entendido"
        }).then((result) => {
            if (result.isConfirmed) {
                getLocation();
                //forzar refrescar listado
                window.location = "";
            }
        });


    });

    $(".__syncInfo").click(function() {
        console.log("va sincronizar...");


        var arrayPlaces = [];
        // get the JSON info from the local storage
        var dataJSON = localStorage.getItem('placesToSave');

        var arrayEvidences = [];
        // get the JSON info from the local storage
        var dataJSONEvidences = localStorage.getItem('evidencesToSave');

        if (dataJSONEvidences) {
            arrayEvidences = JSON.parse(dataJSONEvidences);
        }

        if (dataJSON) {
            // transform the JSON to an array objects
            arrayPlaces = JSON.parse(dataJSON);

            for (var i = 0; i < arrayPlaces.length; i++) {
                $.ajax({
                    type: 'POST',
                    url: 'processplace.php',
                    data: arrayPlaces[i],
                    async: false,
                    success: function(response) {
                        // Manejar la respuesta exitosa
                        console.log("sincronizô correctamente un lugar.");
                        arrayPlaces[i].remove = true;
                        response = JSON.parse(response).place;
                        arrayPlaces[i].id = response.id;
                    },
                    error: function(xhr, status, error) {
                        // Manejar errores
                        console.error('Error al sincronizar el registro offline:', error);

                    }
                });
            }
            var tmpArrayPlaces = [];
            for (var i = 0; i < arrayPlaces.length; i++) {
                if (!arrayPlaces[i].remove) {
                    tmpArrayPlaces.push(arrayPlaces[i]);
                } else {
                    //va actualizar las evidencias con el nuevo ID del servidor
                    if (arrayEvidences.length > 0) {
                        for (var j = 0; j < arrayEvidences.length; j++) {
                            if (arrayPlaces[i].tempId.toString() == arrayEvidences[j].evidenceidPlace.toString()) {
                                arrayEvidences[j].evidenceidPlace = arrayPlaces[i].id;
                            }
                        }
                    }
                }
            }
            if (tmpArrayPlaces.length == 0) {
                localStorage.removeItem('placesToSave');
            } else {
                dataJSON = JSON.stringify(tmpArrayPlaces);
                localStorage.setItem('placesToSave', dataJSON);
            }



        }




        if (arrayEvidences.length > 0) {


            for (var i = 0; i < arrayEvidences.length; i++) {

                // Convertir la cadena base64 a un blob
                /*var byteCharacters = atob(arrayEvidences[i].image.split(',')[1]);
                var byteNumbers = new Array(byteCharacters.length);
                for (var j = 0; j < byteCharacters.length; j++) {
                    byteNumbers[j] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: 'image/jpeg' });*/

                // Crear un archivo a partir del blob
                //var file = new File([blob], Math.floor(Date.now() / 1000)+'-bysync.jpg', { type: 'image/jpeg' });
                //arrayEvidences[i].image = file;


                var formData = new FormData();

                // Agregar campos al objeto FormData
                formData.append('evidence-description', arrayEvidences[i].evidenceDescription);
                formData.append('evidence-idPlace', arrayEvidences[i].evidenceidPlace);
                formData.append('latitude', 0);
                formData.append('longitude', 0);
                formData.append('redirect', 'No');
                // Agregar el archivo al objeto FormData
                //formData.append('image', blob,  Math.floor(Date.now() / 1000)+'-bysync.jpg');
                formData.append('image', arrayEvidences[i].image);

                $.ajax({
                    type: 'POST',
                    url: 'process.php',
                    data: formData,
                    processData: false,
                    contentType: false,
                    async: false,
                    success: function(response) {
                        // Manejar la respuesta exitosa
                        console.log("sincronizô correctamente una evidencia.");
                        arrayEvidences[i].remove = true;
                    },
                    error: function(xhr, status, error) {
                        // Manejar errores
                        console.error('Error al sincronizar el registro offline:', error);

                    }
                });
            }
            var tmpArrayEvidences = [];
            for (var i = 0; i < arrayEvidences.length; i++) {
                if (!arrayEvidences[i].remove) {
                    tmpArrayEvidences.push(arrayEvidences[i]);
                }
            }
            if (tmpArrayEvidences.length == 0) {
                localStorage.removeItem('evidencesToSave');
            } else {
                dataJSON = JSON.stringify(tmpArrayEvidences);
                localStorage.setItem('evidencesToSave', dataJSON);
            }

        }

        Swal.fire({
            title: "Sincronización completa",
            text: "Se han sincronizado los registros",
            icon: "success",
            showCancelButton: false,
            confirmButtonText: "OK entendido"
        }).then((result) => {
            if (result.isConfirmed) {
                getLocation();
                //forzar refrescar listado
                window.location = "";
            }
        });




    })

    function displayMessage(typeMessage, execution, typeAsset) {

        var msg = "";

        switch (typeAsset) {
            case "sync":
                msg = "Sincronización ha terminado";
                break;
            case "place":
                msg = "El lugar se ha registrado";
                break;
            case "evidence":
                msg = "Se ha asociado la evidencia";
                break;
        }

        switch (execution) {
            case "local":
                msg = msg + " en el dispositivo. Pendiente de sincronizar al servidor";
                break;
            case "server":
                msg = msg + " en el servidor";
                break;
        }

        Swal.fire({
            icon: typeMessage,
            title: "Resultado",
            text: msg
        });

    }

    function displayPointsLocations(points) {
        if (points.length > 0) {
            var listPlaces = document.getElementById('list_places');
            listPlaces.innerHTML = ''; // Clear existing content

            points.forEach(function(item) {
                var div = document.createElement('div');
                div.className = "item-place";
                div.innerHTML = '<div class="item-title"><strong>' + item.date + '</strong><p><span clas="iconmap"></span>' + item.name + '</p></div><div class="item-actions _view-detail"><button class="btn" data-location="' + item.id + '">Ver</button></div>';
                listPlaces.appendChild(div);

                var myIcon = L.icon({
                    iconUrl: 'AppIcons/location.png',
                    iconSize: [40, 40],
                    iconAnchor: [22, 94],
                    popupAnchor: [-3, -76],
                });


                //var marker =L.marker([item.latitude,item.longitude],{icon: myIcon}).addTo(map);
                var marker = L.marker([item.latitude, item.longitude]).addTo(map);
                marker._icon.classList.add("huechange");
            });
        }

    }

    function displayPlaceDetail(idPlace) {
        var timeline = document.getElementById('timeline');
        if (timeline.innerHTML == "") {
            var li = document.createElement('li');
            li.innerHTML = '<p>No tiene evidencias registradas.</p>';
            timeline.appendChild(li);
        }

        const currentPlace = places_points.find(function(place) {
            return (typeof place.id == "undefined" ? place.tempId.toString() : place.id.toString()) === idPlace.toString();
        });

        $("#detail-placename").text(currentPlace.name);
        $("#detail-date").text(currentPlace.date);
        $("#detail-longitude").text(currentPlace.longitude);
        $("#detail-latitude").text(currentPlace.latitude);
        $("#detail-description-text").text(currentPlace.description);
        $("._addEvidence").attr("data-placeDetailID", typeof currentPlace.id == "undefined" ? currentPlace.tempId : currentPlace.id);
    }


});




// Function to create timeline items
function createTimelineItems() {
    var timeline = document.getElementById('timeline');
    timeline.innerHTML = ''; // Clear existing content

    timelineData.forEach(function(item) {
        var li = document.createElement('li');
        li.innerHTML = '<div><strong>' + item.date + '</strong>' +
            '<p>' + item.description + '</p><p><img src="uploads/' + item.event + '" class="img-timeline"></img></p></div>';
        timeline.appendChild(li);
    });
}



function viewDetailPlace() {
    $("#container").find(".page").addClass("_hideform");
    $("#detailpoint").removeClass("_hideform");
    loadDeatilView();
}