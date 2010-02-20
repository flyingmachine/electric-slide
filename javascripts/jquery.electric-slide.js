(function($) {

$.fn.electricSlide = function(options){
  /*
    In all of the functions defined in settings,
    "this" refers to the slide element.

    Each slide element has a "slideContext" attribute
    which you can use to refer to anything defined here.
  */
  // dummy function; is this necessary?
  function trueSlideFunction(oldSlidePosition, newSlidePosition){
    return true;
  }
  var settings = {
    slideSelector            : ".slide",

    // header
    shouldInsertHeader       : true,
    titleSelector            : "h3",
    nextHtml                 : "<a href='#' class='slide-navigation next'>next</a>",
    previousHtml             : "<a href='#' class='slide-navigation previous'>previous</a>",

    // show/hide 
    showFunction             : function(){$(this).slideDown()},
    hideFunction             : function(){$(this).hide()},

    // callbacks
    slideShouldGetFocus      : trueSlideFunction, // allows you to prevent the slide from losing focus; not sure if "getFocus" should be "hide"
    slideWillGetFocus        : trueSlideFunction, // setup the slide before it appears
    slideDidGetFocus         : trueSlideFunction, // do stuff with the slide after it appears
    slideShouldLoseFocus     : trueSlideFunction,
    slideWillLoseFocus       : trueSlideFunction,
    slideDidLoseFocus        : trueSlideFunction
  }

  $.extend(settings, options)
  
  this.each(function(){
    var slideContext = this;
    var slideContainer = $(this);
    var slides = $(settings.slideSelector, slideContainer);
    var currentSlidePosition = 0;
    var titles = $(settings.slideSelector + " > " + settings.titleSelector);
    
    // Set slide container height
    var maxHeight = 0;
    var maxTopMargin = 0;
    var maxBottomMargin = 0;
    var maxTopPadding = 0;
    var maxBottomPadding = 0;
    var maxTopBorder = 0;
    var maxBottomBorder = 0;

    function setMaxDimensions(slideElem) {
      var height = $(slideElem).height();
      if(height > maxHeight) maxHeight = height;

      // margins
      var margins = $(slideElem).margin();

      var topMargin = margins.top;
      if(topMargin > maxTopMargin) maxTopMargin = topMargin;

      var bottomMargin = margins.bottom;
      if(bottomMargin > maxBottomMargin) maxBottomMargin = bottomMargin;

      // padding
      var padding = $(slideElem).padding();

      var topPadding = padding.top;
      if(topPadding > maxTopPadding) maxTopPadding = topPadding;

      var bottomPadding = padding.bottom;
      if(bottomPadding > maxBottomPadding) maxBottomPadding = bottomPadding;


      // border
      var border = $(slideElem).border();

      var topBorder = border.top;
      if(topBorder > maxTopBorder) maxTopBorder = topBorder;

      var bottomBorder = border.bottom;
      if(bottomBorder > maxBottomBorder) maxBottomBorder = bottomBorder;
    }

    function resetDimensions() {
      maxHeight = 0;
      maxTopMargin = 0;
      maxBottomMargin = 0;
      maxTopPadding = 0;
      maxBottomPadding = 0;
      maxTopBorder = 0;
      maxBottomBorder = 0;
      slides.each(function(){
        $(this).width(slideWidth());
        setMaxDimensions(this);
        setSlideContainerHeight();
      })
    }

    function slideWidth() {
      return $("#slides").width()
    }

    function insertHeader(i, slideElem){
      var header = $("<div class='slide-header'></div>'")

      // don't show next/previous if there is no next/previous
      if(i > 0) {
        var previousElement = $(settings.previousHtml)
        if(titles[i-1]) previousElement.text($(titles[i-1]).text())
        previousElement.click(showPreviousSlide)
        header.append(previousElement)
      }
      
      if(i < maxSlidePosition()) {
        var nextElement = $(settings.nextHtml)
        if(titles[i+1]) nextElement.text($(titles[i+1]).text())
        nextElement.click(showNextSlide)
        header.append(nextElement);
      }

      $(slideElem).prepend(header)
    }

    function currentSlide() {
      return slides[currentSlidePosition][0];
    }

    function maxSlidePosition() {
      return slides.size() - 1;
    }

    // setup slides
    slides.each(function(i){
      if(settings.shouldInsertHeader) insertHeader(i, this);
      $(this).width(slideWidth());
      setMaxDimensions(this);

      if(i == 0) {
        $(this).show();
      }

      this.slideContext    = slideContext;
      this.show = settings.showFunction;
      this.hide = settings.hideFunction;
      this.shouldGetFocus  = settings.slideShouldGetFocus;
      this.willGetFocus    = settings.slideWillGetFocus;
      this.didGetFocus     = settings.slideDidGetFocus;
      this.shouldLoseFocus = settings.slideShouldLoseFocus;
      this.willLoseFocus   = settings.slideWillLoseFocus;
      this.didLoseFocus    = settings.slideDidLoseFocus;
    })
    
    // setup dimensions
    function setSlideContainerHeight() {
      slideContainer.height(maxHeight + maxTopMargin + maxBottomMargin + maxTopPadding + maxBottomPadding + maxTopBorder + maxBottomBorder)
    }
    setSlideContainerHeight();
    $(window).resize(resetDimensions)

    // Navigation
    function showSlide(newSlidePosition) {
      var oldSlidePosition = currentSlidePosition;
      var oldSlide = slides[currentSlidePosition];
      var newSlide = slides[newSlidePosition];

      if(!newSlide) {
        return false;
      }
      
      // give the opportunity to prevent the slide from changing
      if(!oldSlide.shouldLoseFocus(oldSlidePosition, newSlidePosition)) {
        return false;
      }
      oldSlide.willLoseFocus(oldSlidePosition, newSlidePosition);
      oldSlide.hide(oldSlidePosition, newSlidePosition);
      oldSlide.didLoseFocus(oldSlidePosition, newSlidePosition);

      // should I really be doing this? will just leave the slideshow blank
      if(!newSlide.shouldGetFocus(oldSlidePosition, newSlidePosition)) {
        return false;
      }
      oldSlide.willGetFocus(oldSlidePosition, newSlidePosition);
      newSlide.show(oldSlidePosition, newSlidePosition);
      newSlide.didGetFocus(oldSlidePosition, newSlidePosition);
      currentSlidePosition = newSlidePosition;
    }

    function showNextSlide() {
      newSlidePosition = currentSlidePosition + 1;
      if(newSlidePosition <= maxSlidePosition()) {
        showSlide(newSlidePosition)
      }
    }

    function showPreviousSlide() {
      newSlidePosition = currentSlidePosition - 1;
      if(newSlidePosition >= 0) {
        showSlide(newSlidePosition)
      }
    }
    
    // similar to http://github.com/nakajima/slidedown/blob/master/templates/javascripts/slides.js
    function clickMove(e) {
      var x = e.pageX - this.offsetLeft;

      if (x < slideWidth() / 2) {
        showPreviousSlide();
      } else {
        showNextSlide();
      }
    }
    slideContainer.dblclick(clickMove)

    return this;
  });
};

})(jQuery);