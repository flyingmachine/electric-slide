(function($) {

$.fn.electricSlide = function(options){
  /*
    In all of the functions defined in settings,
    "this" refers to the slide element.

    Each slide element has a "slideContext" attribute
    which you can use to refer to anything defined here.
    
    The "slideContext" is just the the slide container element (I think)
  */
  // dummy function; is this necessary?
  function trueSlideFunction(oldSlidePosition, newSlidePosition){
    return true;
  }
  var settings = {
    slideClass               : "slide",

    // header/navigation
    shouldInsertHeader       : true,
    titleSelector            : "h3",
    // "next/previous" text is replaced with title if there is one
    // href is replaced with "#slide-i", where i is slide's position
    nextHtml                 : "<a href='#' class='slide-navigation next'>next</a>",
    previousHtml             : "<a href='#' class='slide-navigation previous'>previous</a>",
    
    buildToc     : true,
    tocContainerSelector     : "#table-of-contents",

    // show/hide 
    showFunction             : function(){$(this).slideDown()},
    hideFunction             : function(){$(this).hide()},

    // callbacks
    slideShouldGetFocus      : trueSlideFunction, // allows you to prevent the slide from losing focus; not sure if "getFocus" should be "hide"
    slideWillGetFocus        : trueSlideFunction, // setup the slide before it appears.. or something
    slideDidGetFocus         : trueSlideFunction, // do stuff with the slide after it appears
    slideShouldLoseFocus     : trueSlideFunction,
    slideWillLoseFocus       : trueSlideFunction,
    slideDidLoseFocus        : trueSlideFunction,
    
    // toggling presentation styles
    toggleSelector           : "#slide-toggle"
  }

  $.extend(settings, options)
  settings.slideSelector = "." + settings.slideClass
  
  this.each(function(){
    var slideContainer = $(this);
    var slides = $(settings.slideSelector, slideContainer);
    var currentSlidePosition = 0;
    var titles = $(settings.slideSelector + " > " + settings.titleSelector);
    var tocContainer; // table of contents container
    var tableOfContents;
    
    
    /***
     * Height and width functions
     */
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

    function resetDimensions(animationDuration) {
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
        setSlideContainerHeight(animationDuration);
      })
    }
    
    function slideWidth() {
      return $("#slides").width()
    }
    
    function slideContainerHeight() {
      return maxHeight + maxTopMargin + maxBottomMargin + maxTopPadding + maxBottomPadding + maxTopBorder + maxBottomBorder
    }
    
    function setSlideContainerHeight(animationDuration) {
      if(typeof(animationDuration) != "undefined") {
        slideContainer.animate({height:slideContainerHeight()}, animationDuration)
      } else {
        slideContainer.height(slideContainerHeight())
      }
      
    }

    /***
     * Navigation functions
     */
    function currentSlide() {
      return slides[currentSlidePosition][0];
    }

    function maxSlidePosition() {
      return slides.size() - 1;
    }
    
    // Navigation
    function showSlide(newSlidePosition) {
      var oldSlidePosition = currentSlidePosition;
      var oldSlide = slides[currentSlidePosition];
      var newSlide = slides[newSlidePosition];

      if(!newSlide || oldSlidePosition == newSlidePosition) {
        return false;
      }
      
      // give the opportunity to prevent the slide from changing
      if(!oldSlide.shouldLoseFocus(oldSlidePosition, newSlidePosition)) {
        return false;
      }
      oldSlide.willLoseFocus(oldSlidePosition, newSlidePosition);
      // TODO should this go into willlosefocus?
      $(oldSlide).stop();
      oldSlide.hide(oldSlidePosition, newSlidePosition);
      oldSlide.didLoseFocus(oldSlidePosition, newSlidePosition);

      // should I really be doing this? will just leave the slideshow blank
      if(!newSlide.shouldGetFocus(oldSlidePosition, newSlidePosition)) {
        return false;
      }
      newSlide.willGetFocus(oldSlidePosition, newSlidePosition);
      newSlide.show(oldSlidePosition, newSlidePosition);
      newSlide.didGetFocus(oldSlidePosition, newSlidePosition);
      currentSlidePosition = newSlidePosition;
      
      // highlight toc item if applicable
      if(typeof(activateCurrentTocLine) != "undefined")  activateCurrentTocLine();
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
    
    /***
     * Navigation HTML functions
     */
    function insertHeader(i, slideElem){
      var header = $("<div class='slide-header'></div>'");
      var j;

      // don't show next/previous if there is no next/previous
      if(i > 0) {
        j = i - 1;
        var previousElement = $(settings.previousHtml)
        if(titles[j]) previousElement.text((j + 1) + ". " + $(titles[j]).text()) // replace link text with title of prev slide
        previousElement.click(showPreviousSlide)
        header.append(previousElement)
      }

      if(i < maxSlidePosition()) {
        j = i + 1;
        var nextElement = $(settings.nextHtml)
        if(titles[j]) nextElement.text((j + 1) + ". " + $(titles[j]).text()) // replace link text with title of next slide
        nextElement.click(showNextSlide)
        header.append(nextElement);
      }

      $(slideElem).prepend(header)
    }
    
    // TODO allow users to provide their own function for generating the toc
    function generateToc() {
      tocContainer = $(settings.tocContainerSelector)

      tableOfContents = $("<ol class='slide-toc'></ol>")
      tableOfContents.lines = [];

      titles.each(function(i){
        line = $("<li><a href='#slide-" + i + "'>" + $(this).text() + "</a></li>")
        $("a", line).click(function(){showSlide(i)}) // could optimize this
        tableOfContents.append(line)
      })

      tocContainer.append(tableOfContents);

      this.activateCurrentTocLine = function() {
        tableOfContents.children("li.active").removeClass("active")
        tableOfContents.children("li:eq(" + currentSlidePosition + ")").addClass("active")
      }
    }
    
    /***
     * Expand/Collapse
     */
    function expandAll() {
      slides.show()
      slides.children(".slide-header").hide()
      slideContainer.animate({height:$("#track").height()})
      return false;
    }
    
    function collapseAll() {
      slides.children(".slide-header").show()
      slides.hide()
      $(slides[0]).show()
      resetDimensions(400)
      return false;
    }
    
    /***
     * Alter elements - create an electric slide! Yeah!
     */
    // setup slides
    slides.each(function(i){
      // insert an anchor
      
      if(settings.shouldInsertHeader) insertHeader(i, this);
      $(this).width(slideWidth());
      setMaxDimensions(this);

      if(i == 0) {
        $(this).show();
      }

      this.slideContext    = this;
      this.show = settings.showFunction;
      this.hide = settings.hideFunction;
      this.shouldGetFocus  = settings.slideShouldGetFocus;
      this.willGetFocus    = settings.slideWillGetFocus;
      this.didGetFocus     = settings.slideDidGetFocus;
      this.shouldLoseFocus = settings.slideShouldLoseFocus;
      this.willLoseFocus   = settings.slideWillLoseFocus;
      this.didLoseFocus    = settings.slideDidLoseFocus;
    })
    
    // setup dimensions - needs to happen after slides are set up
    // to account for navigation being inserted
    setSlideContainerHeight();
    $(window).resize(resetDimensions)
    
    // more handlers
    slideContainer.click(clickMove)
    $(settings.toggleSelector).toggle(expandAll, collapseAll)
    
    // generate the TOC
    if(settings.buildToc) generateToc();
    
    
  }); // end this.each
  return this;
};

})(jQuery);