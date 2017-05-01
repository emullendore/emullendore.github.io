function DoTheThing(){

$('.portfolio-thumbnail').on({
    mouseenter: function() {

        $(this).animate({opacity: 0.5},200)
    },
    mouseleave: function() {

        $(this).animate({opacity: 1},200)
    }
  })

// $().on({
//     mouseenter: function() {
//       console.log('hi');
//
//         $(this).animate({fontcolor: 'steelblue'},200)
//     },
//     mouseleave: function() {
//       console.log('hi');
//
//         $(this).animate({fontcolor: 'grey'},200)
//     }
//   })
};

$(document).ready(DoTheThing);
