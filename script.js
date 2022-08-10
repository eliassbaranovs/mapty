'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = Date.now() + ''.slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //Super because they are common with Workout class(parent class)
    this.cadence = cadence;
    this.calcPace();
  }
  //Methods
  calcPace() {
    // km/min
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration, elevationGain); //Super because they are common with Workout class(parent class)
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  //Methods
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//Methods

//App class
class App {
  //Private fields
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();

    //Attach event listeners to DOM elements
    //Form control
    form.addEventListener('submit', this._newWorkout.bind(this));

    //Running/Cycling switching
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  //Methods
  _getPosition() {
    //Geolocation API and Leaflet map API
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log('Location not found');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 18);

    //Displaying map with Leaflet library

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot//{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    //Helper function
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If its running create a new Running object and check if data is valid
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input is not valid');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If its cycling create a new Cycling object and check if data is valid
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input is not valid');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Add the new object to the workouts array
    this.#workouts.push(workout);
    //Render workout on the map as a marker

    //Render the workout on the list

    //Hide the form + clear the input fields after submission

    //Clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    //Display marker on map
    this.renderWorkoutMarker(workout);
  }
  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `<b>You did ${workout.type} for ${workout.duration} minutes!`
      )
      .openPopup();
  }
}
const app = new App();
