'use strict';

// prettier-ignore

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
  _setDescription() {
    //prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} `;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //Super because they are common with Workout class(parent class)
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
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
    this._setDescription();
  }
  //Methods
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//App class
class App {
  //Private fields
  #map;
  #mapZoomLevel = 18;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get users position
    this._getPosition();
    //Get data from local storage
    this._getlocalStorage();
    //Attach event listeners to DOM elements
    //Form control
    form.addEventListener('submit', this._newWorkout.bind(this));

    //Running/Cycling switching
    inputType.addEventListener('change', this._toggleElevationField.bind(this));

    //Move map center to clicked excercise
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    //Displaying map with Leaflet library
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot//{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    //Render marker from local storage
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
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

    //Render the workout on the list
    this._renderWorkout(workout);
    //Hide the form + clear the input fields after submission
    this._hideForm();
    //Clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    //Set local storage on all workouts
    this._setLocalStorage();
    //Display marker on map
    this._renderWorkoutMarker(workout);
  }
  _renderWorkoutMarker(workout) {
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
        `${workout.type === 'running' ? '🏃' : '🚴‍'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class='workout workout--${workout.type}' data-id='${workout.id}'>
        <h2 class='workout__title'>${workout.description}</h2>
        <div class='workout__details'>
          <span class='workout__icon'>${
            workout.type === 'running' ? '🏃' : '🚴‍'
          }‍️</span>
          <span class='workout__value'>${workout.distance}</span>
          <span class='workout__unit'>km</span>
        </div>
        <div class='workout__details'>
          <span class='workout__icon'>⏱</span>
          <span class='workout__value'>${workout.duration}</span>
          <span class='workout__unit'>min</span>
        </div>
      `;

    //based on workout type, html code appended
    if (workout.type === 'running') {
      html += `
            <div class='workout__details'>
              <span class='workout__icon'>⚡️</span>
              <span class='workout__value'>${workout.pace.toFixed(1)}</span>
              <span class='workout__unit'>min/km</span>
            </div>
            <div class='workout__details'>
              <span class='workout__icon'>🦶🏼</span>
              <span class='workout__value'>${workout.cadence}</span>
              <span class='workout__unit'>spm</span>
            </div>
          </li>
          `;
    }

    if (workout.type === 'cycling') {
      html += `
            <div class='workout__details'>
              <span class='workout__icon'>⚡️</span>
              <span class='workout__value'>${workout.speed.toFixed(1)}</span>
              <span class='workout__unit'>km/h</span>
            </div>
            <div class='workout__details'>
              <span class='workout__icon'>⛰</span>
              <span class='workout__value'>${workout.elevationGain}</span>
              <span class='workout__unit'>m</span>
            </div>
          </li>
          `;
    }

    form.insertAdjacentHTML(`afterend`, html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  //Store and retrieve data in local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getlocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }
  //Reset, run from console--- app.reset();
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
