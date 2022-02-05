const searchForm = document.querySelector('#search-form');
const searchFormBtn = document.querySelector('#form-btn');
const cityInput = document.querySelector('#city');
const countryInput = document.querySelector('#country');
let currentSelectionFocus = -1;

document.addEventListener('DOMContentLoaded', async () => {
  const city = localStorage.getItem('city');
  const countryCode = localStorage.getItem('countryCode');

  if (city && countryCode) {
    await submitSearch(city, countryCode);
  }

  document.querySelector('#loading').classList.add('d-none');
  document.querySelector('#main-container').classList.remove('d-none');
});

document.addEventListener('click', () => {
  clearAutocompleteList();
});

function clearAutocompleteList() {
  const autoContainer = document.querySelector('#autocomplete-container');
  const autoItems = document.querySelectorAll('.autocomplete-item');
  autoItems.forEach((el) => {
    autoContainer.removeChild(el);
  });
}

function removeActiveSelection() {
  const autoItems = document.querySelectorAll('#autocomplete-container .autocomplete-item');

  if (autoItems.length) {
    for (let item of autoItems) {
      item.classList.remove('autocomplete-item-active');
    }
  }
}

function addActiveSelection() {
  removeActiveSelection();
  const autoItems = document.querySelectorAll('#autocomplete-container .autocomplete-item');

  if (autoItems.length) {
    if (currentSelectionFocus >= autoItems.length) {
      currentSelectionFocus = 0;
    }

    if (currentSelectionFocus < 0) {
      currentSelectionFocus = autoItems.length - 1;
    }

    autoItems[currentSelectionFocus].classList.add('autocomplete-item-active');
  }
}

function removeErrorMsg() {
  const errorContainer = document.querySelector('#form-error');
  const errorPara = document.querySelector('#form-error .alert');

  if (errorPara) {
    errorContainer.removeChild(errorPara);
  }
}

function addErrorMsg(errorMsg) {
  const errorContainer = document.querySelector('#form-error');
  const errorPara = document.createElement('p');
  errorPara.setAttribute('class', 'alert alert-danger');
  errorPara.innerText = errorMsg;
  errorContainer.appendChild(errorPara);
}

async function submitSearch(city, countryCode) {
  searchFormBtn.disabled = true;
  searchFormBtn.innerText = 'Searching...';

  try {
    const result = await fetch(
      `https://2101mkbg66.execute-api.us-west-2.amazonaws.com/v1/weather?q=${city},${countryCode}`
    );
    const data = await result.json();

    if (data.cod !== 200) {
      addErrorMsg(data.message);
    } else {
      // Capitalize the first letter of each word in the city name
      const cityStrArr = [];

      for (let c of city.split(' ')) {
        cityStrArr.push(c[0].toUpperCase() + c.slice(1).toLowerCase());
      }

      const cityStr = cityStrArr.join(' ');

      // Add data to UI
      const weatherHeading = document.querySelector('#weather-heading');
      const temperature = document.querySelector('#temperature');
      const img = document.querySelector('#img');
      const humidity = document.querySelector('#humidity');
      const feelsLike = document.querySelector('#feels-like');
      const minMax = document.querySelector('#min-max');
      const wind = document.querySelector('#wind');
      const changeBtn = document.querySelector('#change-btn');
      const searchModalLabel = document.querySelector('#search-modal-label');

      weatherHeading.innerText = `${cityStr}, ${countryCode}`;
      temperature.innerHTML = `${Math.round(data.main.temp)} &#8457;`;
      img.innerHTML = `<img src="https://openweathermap.org/img/w/${data.weather[0].icon}.png" alt="Open Weather Map icon" class="d-block m-auto">`;
      humidity.innerText = `${data.main.humidity}%`;
      feelsLike.innerHTML = `${Math.round(data.main.feels_like)} &#8457;`;
      minMax.innerHTML = `${Math.round(data.main.temp_min)}&#8457;/${Math.round(data.main.temp_max)}&#8457;`;
      wind.innerText = `${Math.round(data.wind.speed)}mph`;
      changeBtn.innerText = 'Change Location';
      searchModalLabel.innerText = 'Change Location';

      // Add city and country code to local storage
      localStorage.setItem('city', cityStr);
      localStorage.setItem('countryCode', countryCode);

      // Close modal
      document.querySelector('.close').click();
    }
  } catch (error) {
    addErrorMsg(error.message);
  } finally {
    searchFormBtn.disabled = false;
    searchFormBtn.innerText = 'Search';
  }
}

countryInput.addEventListener('input', () => {
  clearAutocompleteList();

  if (countryInput.value) {
    currentSelectionFocus = -1;

    for (const country of countries) {
      if (country.name.substring(0, countryInput.value.length).toLowerCase() === countryInput.value.toLowerCase()) {
        const autoContainer = document.querySelector('#autocomplete-container');

        const autoItem = document.createElement('div');
        autoItem.setAttribute('class', 'autocomplete-item');
        autoItem.innerHTML = country.name;
        autoItem.innerHTML += `<input type='hidden' value='${country.name}'>`;

        autoItem.addEventListener('click', (e) => {
          const country = e.target.getElementsByTagName('input')[0].value;
          countryInput.value = country;
          clearAutocompleteList();
        });

        autoContainer.appendChild(autoItem);
        searchForm.insertBefore(autoContainer, searchFormBtn);
      }
    }
  }
});

countryInput.addEventListener('keydown', function (e) {
  if (e.keyCode === 40) {
    // If the DOWN arrow key is pressed
    currentSelectionFocus++;
    addActiveSelection();
  } else if (e.keyCode === 38) {
    // If the UP arrow key is pressed
    currentSelectionFocus--;
    addActiveSelection();
  } else if (e.keyCode === 13) {
    // If the ENTER key is pressed
    e.preventDefault();

    if (currentSelectionFocus > -1) {
      const autoItems = document.querySelectorAll('#autocomplete-container .autocomplete-item');

      if (autoItems.length) {
        autoItems[currentSelectionFocus].click();
        currentSelectionFocus = -1;
      }
    }
  }
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  removeErrorMsg();

  // Validate city and country values
  const cityValue = cityInput.value.trim();
  const countryValue = countryInput.value.trim();

  if (!cityValue || !countryValue) {
    addErrorMsg('Please fill out all fields');
    return;
  }

  // Validate country
  const country = countries.find((c) => c.name.toLowerCase() === countryValue.toLowerCase());

  if (!country) {
    addErrorMsg(`${countryValue} is not a valid country`);
    return;
  }

  clearAutocompleteList();

  // Send fetch request
  submitSearch(cityValue, country.code);
});
