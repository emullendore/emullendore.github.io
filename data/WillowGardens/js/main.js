// scroll page down when arrow is clicked
document.querySelector('#arrow-down').addEventListener('click', (event) => {
  event.stopPropagation();
  document.querySelector('.content-container').scrollIntoView({behavior: "smooth"});
});
