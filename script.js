const API_KEY = "97c7be30";
const BASE_URL = "https://www.omdbapi.com/";

const movieSearchBox = document.getElementById('movieName');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');
const resultContainer = document.getElementById('result-container');

// Debounce function to limit API calls
function debounce(func, delay) {
  let timeoutId;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
}

// Load movies from API with error handling
async function loadMovies(searchTerm) {
  try {
    const URL = `${BASE_URL}?s=${encodeURIComponent(searchTerm)}&page=1&apikey=${API_KEY}`;
    const response = await fetch(URL);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.Response === "True") {
      displayMovieList(data.Search);
    } else {
      searchList.innerHTML = `<div class="no-results">No results found for "${searchTerm}"</div>`;
      searchList.classList.add('active');
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
    searchList.innerHTML = `<div class="error-message">Failed to load results. Please try again later.</div>`;
    searchList.classList.add('active');
  }
}

// Debounced version of findMovies
const debouncedFindMovies = debounce(findMovies, 300);

function findMovies() {
  let searchTerm = movieSearchBox.value.trim();
  if (searchTerm.length > 2) {
    searchList.classList.add('active');
    loadMovies(searchTerm);
  } else {
    searchList.classList.remove('active');
    resultContainer.style.display = 'none';
  }
}

// Display movie list in search results
function displayMovieList(movies) {
  searchList.innerHTML = "";
  
  // Limit to 8 results for better UX
  const displayedMovies = movies.slice(0, 8);
  
  displayedMovies.forEach(movie => {
    const movieListItem = document.createElement('div');
    movieListItem.dataset.id = movie.imdbID;
    movieListItem.classList.add('search-list-item');
    
    const moviePoster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/50x75?text=No+Poster";
    
    movieListItem.innerHTML = `
      <div class="search-item-thumbnail">
        <img src="${moviePoster}" alt="${movie.Title}">
      </div>
      <div class="search-item-info">
        <h3>${movie.Title}</h3>
        <p>${movie.Year} • ${movie.Type}</p>
      </div>
    `;
    
    searchList.appendChild(movieListItem);
  });
  
  loadMovieDetails();
}

// Load movie details when a search result is clicked
function loadMovieDetails() {
  const searchListMovies = searchList.querySelectorAll('.search-list-item');
  
  searchListMovies.forEach(movie => {
    movie.addEventListener('click', async () => {
      searchList.classList.remove('active');
      movieSearchBox.value = "";
      
      try {
        const response = await fetch(`${BASE_URL}?i=${movie.dataset.id}&apikey=${API_KEY}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const movieDetails = await response.json();
        displayMovieDetails(movieDetails);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        resultGrid.innerHTML = `
          <div class="error-message">
            Failed to load movie details. Please try again later.
          </div>
        `;
      }
    });
  });
}

// Display movie details
function displayMovieDetails(details) {
  resultContainer.style.display = 'block';
  
  resultGrid.innerHTML = `
    <div class="movie-details">
      <div class="movie-poster-large">
        <img src="${details.Poster !== "N/A" ? details.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${details.Title}">
      </div>
      <div class="movie-info-detailed">
        <h2>${details.Title} <span class="movie-rating">${details.imdbRating}/10</span></h2>
        
        <ul class="movie-misc-info">
          <li>${details.Year}</li>
          <li>${details.Rated}</li>
          <li>${details.Runtime}</li>
          <li>${details.Genre.split(',').slice(0, 2).join(', ')}</li>
        </ul>
        
        <div class="movie-plot">
          <h3>Plot</h3>
          <p>${details.Plot}</p>
        </div>
        
        <div class="movie-credits">
          <p><strong>Director:</strong> ${details.Director}</p>
          <p><strong>Writers:</strong> ${details.Writer}</p>
          <p><strong>Stars:</strong> ${details.Actors}</p>
        </div>
        
        <div class="movie-awards">
          <p><strong>Awards:</strong> ${details.Awards}</p>
        </div>
      </div>
    </div>
  `;
  
  // Scroll to results for better UX
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Close search list when clicking outside
window.addEventListener('click', (event) => {
  if (!event.target.closest('.search-element')) {
    searchList.classList.remove('active');
  }
});

// Keyboard navigation for accessibility
movieSearchBox.addEventListener('keydown', (e) => {
  const items = searchList.querySelectorAll('.search-list-item');
  let currentItem = document.querySelector('.search-list-item.highlighted');
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!currentItem) {
      items[0]?.classList.add('highlighted');
    } else {
      currentItem.classList.remove('highlighted');
      const nextItem = currentItem.nextElementSibling || items[0];
      nextItem.classList.add('highlighted');
      nextItem.scrollIntoView({ block: 'nearest' });
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentItem) {
      currentItem.classList.remove('highlighted');
      const prevItem = currentItem.previousElementSibling || items[items.length - 1];
      prevItem.classList.add('highlighted');
      prevItem.scrollIntoView({ block: 'nearest' });
    }
  } else if (e.key === 'Enter' && currentItem) {
    e.preventDefault();
    currentItem.click();
  }
});
