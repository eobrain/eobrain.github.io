$ ->

  $content  = $ '#content'
  $children = $ '#children'
  $nav      = $ ".nav"

  #BEGIN dingleton
  currentPage = new ( ->

    fromHash = () ->
       window.location.hash.substring 1

    currentPageId = fromHash()

    # go to home if no hash
    if !currentPage
      window.location.hash = '#home'
      currentPageId = fromHash()

    undisplay = ->
      $('.page-'+currentPageId).removeClass 'current'
      $('#menu-'+currentPageId).removeClass 'active'

    display = ->
      $('.page-'+currentPageId).addClass 'current'
      $('#menu-'+currentPageId).addClass 'active'

    changePageTo = (newPageId) ->
      undisplay()
      currentPageId = newPageId
      display()

    $(window).on 'hashchange', ->
      changePageTo window.location.hash.substring 1

    #end private, begin public

    @displayIf = (pageId) ->
      if pageId == currentPageId
        display()

    null
  )
  #END singleton


  fetchPage = (pageId, children) ->
    $content.append "<article class='page-#{pageId}'></article>"
    $page = $ '.page-'+pageId
    $.get "site/pages/#{ pageId }.txt", (md) ->
      $page.append markdown.toHTML md
      list = "<nav class='page-#{pageId}'><ul>"
      for childId of children
        do (childId) ->
          list += "<li><a href='##{ childId }'>#{ childId }</a></li>"
      list += '</ul></nav>'
      $children.append list


  # Recursive funtion to walk down the structure.json tree
  walkStructure = (pageId, children) ->
    fetchPage pageId, children
    currentPage.displayIf pageId
    for childId, grandchildren of children
      do (childId, grandchildren) ->
        walkStructure childId, grandchildren

  setupTopNav = (home) ->
    for childId of home
      do (childId) ->
        ($nav.append "<li><a href='##{ childId }'>#{ childId }</li>").click () ->


  $.getJSON 'site/config.json', (config) ->
    $('head title').text config.title

  $.getJSON 'site/structure.json', (structure) ->
    setupTopNav structure
    walkStructure 'home', structure


