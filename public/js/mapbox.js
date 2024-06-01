/* eslint-disable */

export const displayMap = () => {
  // document.addEventListener('DOMContentLoaded', () => {
  //DOM ELEMENTS
  const mapBox = document.getElementById('map');
  const loginForm = document.getElementById('.form');

  //DELEGATION
  // This is to fix a error in the console
  if (mapBox) {
    const locationsData = JSON.parse(
      document.getElementById('map').dataset.locations,
    );

    const [longStart, latStart] = locationsData[0].coordinates;

    const map = L.map('map').setView([latStart, longStart], 8);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    for (let i = locationsData.length - 1; i >= 0; i--) {
      const currLocation = locationsData[i];

      const [long, lat] = currLocation.coordinates;

      const marker = L.marker([lat, long]).addTo(map);

      marker
        .bindPopup(
          `<h1>Arrive on Day ${currLocation.day}</h1><br><h1>Location: ${currLocation.description}.</h1>`,
        )
        .openPopup();
    }
  }
  // });
};
