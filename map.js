   // Ініціалізація змінних
   var addingMarkers = false;
   var groupCounter = 0;
   var markerData = {};
   var groupDivs = {};
   var myMap = L.map('map').setView([48.3794, 31.1656], 6);
   var polylines = {};

   // Завантаження карти OpenStreetMap
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
       attribution: '© OpenStreetMap contributors'
   }).addTo(myMap);

   // Визначення кольорів груп
   var groupColors = [
       'blue', 'red', 'green', 'purple', 'orange', 'brown', 'yellow', 'cyan',
       'magenta', 'lime', 'pink', 'teal', 'navy', 'gray', 'indigo'
   ];

   // Додавання обробника події для кнопки додавання нової машини
   document.getElementById('addCarBtn').addEventListener('click', function () {
       addingMarkers = true;
       groupCounter++;
       markerData[groupCounter] = [];

       // Створення інтерфейсу для нової групи
       var currentGroupDiv = document.createElement('div');
       currentGroupDiv.className = 'marker-group';
       currentGroupDiv.innerHTML = `<h5>CAR ID ${groupCounter}</h5><div class='marker-info-group'></div>`;
       groupDivs[groupCounter] = currentGroupDiv;
       document.getElementById('markerGroups').appendChild(currentGroupDiv);

       // Вибір кольору для нової групи
       var color = groupColors[(groupCounter - 1) % groupColors.length];
       polylines[groupCounter] = L.polyline([], { color }).addTo(myMap);
   });

   // Зупинка процесу додавання маркерів
   document.getElementById('stopBtn').addEventListener('click', function () {
       addingMarkers = false;
   });

   // Додавання маркера на карті за кліком
   myMap.on('click', function (e) {
       if (!addingMarkers) return;

       var lat = e.latlng.lat;
       var lng = e.latlng.lng;
       var groupID = groupCounter;
       var color = groupColors[(groupCounter - 1) % groupColors.length];
       var markerIndex = markerData[groupID].length + 1;

       // Створення маркера
       var circleMarker = L.circleMarker([lat, lng], {
           radius: 20,
           fillColor: color,
           fillOpacity: 1,
           color,
           weight: 2
       }).bindTooltip(markerIndex.toString(), { permanent: true, direction: 'center', className: 'circle-marker-label' }).addTo(myMap);

       // Додавання маркера до полілінії відповідної групи
       polylines[groupID].addLatLng([lat, lng]);

       // Створення інтерфейсу для маркера
       var markerInfo = document.createElement('div');
       markerInfo.className = 'marker-info';

       var indexCircle = document.createElement('div');
       indexCircle.className = 'marker-index';
       indexCircle.innerText = markerIndex;
       indexCircle.style.backgroundColor = color;

       // Додавання інформації про маркер
       markerInfo.innerHTML = `${lat.toFixed(4)}, ${lng.toFixed(4)} <button class="btn btn-danger btn-sm btn-cross">x</button>`;
       markerInfo.insertBefore(indexCircle, markerInfo.firstChild);

       var markerItem = { circleMarker, markerInfo, latlng: [lat, lng] };
       markerData[groupID].push(markerItem);

       // Додавання обробника події видалення маркера
       var deleteButton = markerInfo.querySelector('button');
       deleteButton.addEventListener('click', function () {
           myMap.removeLayer(circleMarker);
           markerInfo.remove();

           // Оновлення списку маркерів після видалення
           markerData[groupID] = markerData[groupID].filter(item => item.circleMarker !== circleMarker);

           // Оновлення полілінії 
           var updatedCoords = markerData[groupID].map((item, index) => {
               item.circleMarker.bindTooltip((index + 1).toString(), { permanent: true, direction: 'center', className: 'circle-marker-label' });
               item.markerInfo.querySelector('.marker-index').innerText = index + 1;
               return item.latlng;
           });
           polylines[groupID].setLatLngs(updatedCoords);

           // Видалення порожньої групи
           if (markerData[groupID].length === 0) {
               delete markerData[groupID];
               myMap.removeLayer(polylines[groupID]);
               groupDivs[groupID].remove();
               delete groupDivs[groupID];
           }
       });

       groupDivs[groupID].querySelector('.marker-info-group').appendChild(markerInfo);
   });

   // JSON формат
   function exportRoutesToJson() {
       var routes = {};
       for (var groupID in markerData) {
           routes[groupID] = markerData[groupID].map(item => ({ lat: item.latlng[0], lng: item.latlng[1] }));
       }
       return JSON.stringify(routes, null, 2);
   }

   // Обробник "GENERATE ROUTES"
   document.getElementById('generate').addEventListener('click', function () {
       var routesJson = exportRoutesToJson();
       var blob = new Blob([routesJson], { type: 'application/json' });
       var link = document.createElement('a');
       link.href = URL.createObjectURL(blob);
       link.download = 'routes.json';
       link.click();
   });