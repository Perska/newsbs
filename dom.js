
// ************************
// --- DOM MANIPULATION ---
// ************************

// Note: dom.js depends on NOTHING except the html. It is purely for page setup
// actions, such as modifying html and creating elements. It fires of signals
// in case you want to pick up on what's happening and do extra stuff. There is
// NO api code, logic, request, etc here.

// Well, it's assumed that you'll be using UIkit I guess...

//The dependencies for this file to work!
var DomDeps = {
   log : (msg) => { console.log(msg); },
   signal : (name, data) => { console.log("ignoring signal " + name); }
};

//Some globals that you can mess with if you want, but they are not assumed to
//be usable except within this file. Try not to rely on the globals, use the
//functions instead please.

function hide(e) { e.setAttribute("hidden", ""); }
function unhide(e) { e.removeAttribute("hidden"); }
function setHidden(e, hidden) { if(hidden) hide(e); else unhide(e); }
function setLoading(e, loading) 
{ 
   if(loading)
      e.setAttribute("data-pulsing", "");
   else
      e.removeAttribute("data-pulsing");
}
function addLoading()
{
   this.count = (this.count || 0) + 1;
   setLoading(topnav, true);
}
function removeLoading()
{
   addLoading.count--;
   if(!addLoading.count)
      setLoading(topnav, false);
}

function setConnectionState(state)
{
   const constate = "data-connectionindicator";
   var indicator = document.querySelector("[" + constate + "]");
   indicator.setAttribute(constate, state || "");
}

function setTitle(title)
{
   if(title)
      document.title = title + " - SmileBASIC Source";
   else
      document.title = "SmileBASIC Source";

   //reset the favicon just in case
   document.head.querySelector("[data-favicon]").href = "favicon.ico";
}

//This is the VISIBILITY modifier, it's just how the page LOOKS. So you can
//call this whenever, it won't do anything major.
function setLoginState(loggedIn)
{
   //check current login state. User is logged in if first element (the user
   //login section) is hidden.
   //var currentState = rightpanenav.firstElementChild.hasAttribute("hidden");

   if(loggedIn)
      website.setAttribute("data-loggedin", "true");
   else
      website.removeAttribute("data-loggedin");

   DomDeps.log("Set login visual state to: " + loggedIn);
   DomDeps.signal("setloginstate", loggedIn);
}

function updateGlobalAlert()
{
   setHidden(globalalert, !watchglobalalert.textContent);
}

function increaseMode()
{
   if(leftpane.getAttribute('data-mode') === "0")
      setSplitMode();
   else 
      setFullContentMode();
}

function decreaseMode()
{
   if(leftpane.getAttribute('data-mode') === "2")
      setSplitMode();
   else 
      setFullDiscussionMode();
}

function setFullContentMode()
{
   DomDeps.log("Set full content mode");
   leftpane.setAttribute("data-mode", "2");
   DomDeps.signal("setcontentmode", "content");
}

function setFullDiscussionMode()
{
   DomDeps.log("Set full discussion mode");
   leftpane.setAttribute("data-mode", "0");
   DomDeps.signal("setcontentmode", "discussion");
}

function setSplitMode()
{
   DomDeps.log("Set split discussion/content mode");
   leftpane.setAttribute("data-mode", "1");
   DomDeps.signal("setcontentmode", "split");
}

function formatDiscussions(hasDiscussions, mode)
{
   DomDeps.log("Formatting page, show discussions: " + hasDiscussions);

   //Almost ALWAYS in fullcontent mode
   setFullContentMode();

   if(hasDiscussions)
   {
      unhide(maincontentbar);
      unhide(discussionuserlist);

      if(mode === "discussion")
         setFullDiscussionMode();
      else if(mode ==="split")
         setSplitMode();
      //if(mode === "content")
      //else
   }
   else
   {
      hide(maincontentbar);
      hide(discussionuserlist);
      //setFullContentMode();
   }

   DomDeps.signal("formatdiscussions", { hasDiscussion : hasDiscussions, mode : mode});
}

function setExpandableTextbox(expand)
{
   if(expand)
      postdiscussiontext.removeAttribute("data-expand");
   else
      postdiscussiontext.setAttribute("data-expand", "");
}

function setTheme(theme)
{
   if(theme)
      document.body.setAttribute("data-theme", theme);
   else
      document.body.removeAttribute("data-theme");

   DomDeps.signal("settheme", theme);
}

//function setOldschool(yes)
//{
//   if(yes)
//      document.body.setAttribute("data-oldschool", yes);
//   else
//      document.body.removeAttribute("data-oldschool");
//}

//Set up a clean slate for someone to put content onto the page,
//assuming immediately after.
function initializePage(requester)
{
   DomDeps.log("Initializing page to a clean slate on behalf of: " + requester);

   //Clear out the breadcrumbs
   breadcrumbs.innerHTML = "";

   //Clear out anything that used to be there
   maincontent.innerHTML = "";
   maincontentinfo.innerHTML = "";
   discussionuserlist.innerHTML = "";
   leftpane.removeAttribute("data-permissions");

   //Assume there are no discussions (easier to just hide it)
   formatDiscussions(false);

   //Clean page isn't loading...?
   hide(maincontentloading);
   //setLoading(topnav, false);

   DomDeps.signal("pageinitialize", requester);
}

function renderPage(route, applyTemplate, breadcrumbs)
{
   DomDeps.log("Rendering final page " + route);

   initializePage();

   if(breadcrumbs)
      makeBreadcrumbs(breadcrumbs);

   if(document.getElementById("templates_old").content.getElementById(route))
   {
      var template = cloneTemplate(route);

      if(applyTemplate)
         applyTemplate(template);

      finalizeTemplate(template);
      maincontent.appendChild(template);
   }
   else
   {
      var template = Templates.Load(route);
      if(applyTemplate) applyTemplate(template.element);
      maincontent.appendChild(template.element);
   }

   DomDeps.signal("pagerender", route);
}


// ******************
// --- TEMPLATING ---
// ******************

function cloneTemplate(name)
{
   var templates = document.getElementById("templates_old");
   var elm = templates.content.getElementById(name); 
   //querySelector("#templates > [data-" + name + "]");
   if(!elm)
      throw "No template found: " + name;
   var f = elm.cloneNode(true);
   f.removeAttribute("id");
   f.setAttribute("data-" + name, "");    //!Legacy!
   f.setAttribute("data-template", name); //use this from now on
   return f;
}

function templateSpaClick(event)
{
   event.preventDefault();
   DomDeps.signal("spaclick_event", { element: event.target, url: event.target.href });
}

function finalizeTemplate(elm)
{
   var links = elm.querySelectorAll("[data-spa]");
   var linkArray = [...links];

   if(elm.hasAttribute("data-spa"))
      linkArray.push(elm);

   linkArray.forEach(x => { 
      x.onclick = templateSpaClick; 
      x.removeAttribute("data-spa");
   });

   var tmpls = elm.querySelectorAll("[data-tmpl]");
   [...tmpls].forEach(x => replaceTemplate(x));

   DomDeps.signal("finalizetemplate", { element:elm });

   return elm;
}


function getSwapElement(element, attribute)
{
   if(element.hasAttribute(attribute))
      return element;

	return element.querySelector("[" + attribute + "]");
}

//How does this work?
//-Find an element by (assumed unique) attribute
//-If attribute is empty, that is AN ERROR
//-If attribute has a value, the replacement goes to where the attribute is
// pointing
//-If attribute starts with ., it goes to the MEMBER on the element.
// If element doesn't have that member, try global function
function swapBase(element, attribute, replace)
{
   //First, find parent (could be us). This COULD throw some errors, that's OK
   //because we WANT this to fail if there's no template, that's bad
   while(!element.hasAttribute("data-template"))
   {
      element = element.parentNode;
      if(!(element && element.hasAttribute))
         throw "No template found for attribute " + attribute;
   }

   if(attribute.indexOf("data-") === 0)
      attribute = attribute.substr("data-".length);

   var template = element.getAttribute("data-template");
   var funcname = "tmplswap_" + attribute;
   var dattr = "data-" + attribute;

   //See if the function for get/set is already there. If not, set it UP
   if(!(funcname in element))
   {
      var velm = getSwapElement(element, dattr);

      if(!velm)
      {
         //Maybe it's in a deeper template?
         var found = false;
         [...element.querySelectorAll("[data-template]")].forEach(x =>
         {
            try
            {
               //This will find the FIRST available field, BE CAREFUL!!
               if(!found)
                  found = swapBase(x, attribute, replace);
            }
            catch {}
         });

         if(found)
            return found;

         throw "Couldn't find attribute " + attribute + " in template " + template;
      }

      //Do most of the work now so you don't do it every time it accesses
      var value = velm.getAttribute(dattr);
      var func = null;

      if(!value)
         value = dattr; //Use itself

      //Starting with "." means a function call
      if(value.indexOf(".") === 0)
      {
         value = value.substr(1);

         if(value in velm)
         {
            func = rpl =>
            {
               if(rpl !== undefined) velm[value] = rpl;
               return velm[value];
            };
         }
         else
         {
            func = rpl => window[value](velm, rpl);
         }
      }
      else 
      {
         func = rpl => 
         {
            //WARN: captures the element "velm", is this safe??
            if(rpl !== undefined) velm.setAttribute(value, rpl);
            return velm.getAttribute(value);
         };
      }

      element[funcname] = func;
      velm.removeAttribute(dattr);
   }

   return element[funcname](replace);
}

function findSwap(element, attribute, replace) { swapBase(element, attribute, replace); }
function getSwap(element, attribute) { return swapBase(element, attribute); }

function multiSwap(element, replacements)
{
   for(key in replacements)
      findSwap(element, key, replacements[key]);
}

function replaceTemplate(element)
{
   var replaceMerges = [ "class" ];
   var tmpl = cloneTemplate(element.getAttribute("data-tmpl"));
   multiSwap(tmpl, JSON.parse(element.getAttribute("data-tmpld")));
   [...element.attributes].forEach(x =>
   {
      if(x.name !== "data-tmpl" && x.name !== "data-tmpld")
      {
         var v = x.value;
         if(replaceMerges.indexOf(x.name) >= 0)
            v = (tmpl.getAttribute(x.name) || "") + " " + v;
         tmpl.setAttribute(x.name, v);
      }
   });
   finalizeTemplate(tmpl);
   [...element.childNodes].forEach(x => tmpl.appendChild(x));
   DomDeps.signal("replacetemplate", { original: element, replacement: tmpl });
   element.parentNode.replaceChild(tmpl, element);
}

function copyExistingTemplate(element)
{
   var copy = cloneTemplate(element.getAttribute("data-template"));
   Object.keys(element).filter(x => x.indexOf("tmplswap_") === 0).forEach(x =>
   {
      var field = x.substr("tmplswap_".length);
      findSwap(copy, field, getSwap(element, field));
   });
   return copy;
}


// ******************
// - SUB-TEMPLATING -
// ******************

function makeSearchResult(type, imageLink, link, title, meta)
{
   var result = cloneTemplate("searchresult");
   var swap = {
      "data-link": link,
      "data-name": title,
      "data-meta": meta
   };

   if(imageLink)
      swap["data-image"] = imageLink;
   else //if(type)
      swap.type = type;

   multiSwap(result, swap);
   finalizeTemplate(result);
   return result;
}

function makeMiniSearchResult(imageLink, name, onclick)
{
   var sr = cloneTemplate("minisearchresult");
   multiSwap(sr, {
      "data-image": imageLink,
      "data-name": name
   });
   finalizeTemplate(sr);
   sr.onclick = onclick;
   return sr;
}

function makePermissionUser(imageLink, name, permissions, special)
{
   var sr = cloneTemplate("permissionuser");
   multiSwap(sr, {
      "data-name": name
   });
   if(imageLink)
      findSwap(sr, "image", imageLink);
   if(special)
      findSwap(sr, "special", true);
   if(permissions !== undefined)
      findSwap(sr, "data-value", permissions);
   else
      hide(sr.querySelector("[data-permission]"));
   finalizeTemplate(sr);
   return sr;
}

function makeBreadcrumbs(chain)
{
   chain.forEach(x =>
   {
      var bc = cloneTemplate("breadcrumb");
      multiSwap(bc, {
         "data-link" : x.link,
         "data-text" : x.name
      });
      finalizeTemplate(bc);
      breadcrumbs.appendChild(bc);
   });
}

function recurseTreeSelector(node, func, path, processed, childfield)//, minLevel)
{
   path = path || [];
   childfield = childfield || "children";
   processed = processed || [];
   //minLevel = minLevel || 0;
   if(!processed.some(x => x.id === node.id))
   {
      var level = path.length;
      var newPath = path.slice();
      newPath.push(node);
      //if(level >= minLevel)
      func(node, newPath, level); //newPath.slice(minLevel).map(x => x.name).join(" / "));
      processed.push(node);
      node[childfield].forEach(x => recurseTreeSelector(x, func, newPath, processed, childfield));
   }
}

function fillTreeSelector(tree, selector, includeRoot, childfield)
{
   //var selector = cloneTemplate("treeselector");
   var rootNodes = tree.filter(x => x.id === 0);

   if(!rootNodes.length)
      throw "Can't make a tree without an id 0 root node!";

   var minLevel = includeRoot ? 0 : 1;

   //We're TRUSTING that the tree's 0 id is the root or whatever. Otherwise
   //this entire thing breaks down.
   rootNodes.forEach(x => recurseTreeSelector(x, (node, path, level) =>
   {
      if(level < minLevel)
         return;
      var option = document.createElement("option");
      option.value = node.id;
      option.setAttribute("data-name", node.name);
      option.setAttribute("data-path", path.slice(minLevel).map(x => x.name).join(" / "));
      //option.setAttribute("data-tree", ((level > 0) ? ("| ".repeat(level - 1) + "|-") : "") + node.name);
      //option.setAttribute("title", node.description);
      option.textContent = option.getAttribute("data-path");
      selector.appendChild(option);
   }, undefined, undefined, childfield));

   finalizeTemplate(selector);
   return selector;
}

function makeYoutube(url, playerurl)
{
   var youtube = cloneTemplate("youtube");
   multiSwap(youtube, {
      "data-title" : url,
      "data-link" : url
   });
   var showplayer = youtube.querySelector("[data-showplayer]");
   var hideplayer = youtube.querySelector("[data-hideplayer]");

   if(playerurl)
   {
      showplayer.onclick = e =>
      {
         e.preventDefault();
         var player = cloneTemplate("youtubeplayer");
         multiSwap(player, {
            "data-source" : playerurl 
         });
         youtube.appendChild(player);
         hide(showplayer);
         unhide(hideplayer);
      };
      hideplayer.onclick = e =>
      {
         e.preventDefault();
         [...(youtube.querySelectorAll("[data-youtubeplayer]"))].forEach(
            x => x.parentNode.removeChild(x));
         unhide(showplayer);
         hide(hideplayer);
      };
   }
   else
   {
      hide(showplayer);
      hide(hideplayer);
   }
   finalizeTemplate(youtube);
   return youtube;
}

function makeCollectionItem(element, getValue, key, inline)
{
   var item = cloneTemplate("collectionitem");
   item.querySelector("[data-item]").appendChild(element);
   if(key)
      item.setAttribute("data-key", key);
   if(inline)
      findSwap(item, "inline", "true");
   finalizeTemplate(item);

   item.getValue = getValue;
   return item;
}


// *************
// --- FORMS ---
// *************

function getFormInputs(form)
{
   return form.querySelectorAll("input, textarea, button, select");
}

function formStart(form)
{
   var inputs = getFormInputs(form);
   for(var i = 0; i < inputs.length; i++)
      inputs[i].setAttribute("disabled", "");
   var submit = form.querySelector("[type='submit']");
   submit.parentNode.appendChild(cloneTemplate("spinner"));
   var errors = form.querySelectorAll("[data-error]");
   for(var i = 0; i < errors.length; i++)
      errors[i].parentNode.removeChild(errors[i]);
}

function formEnd(form)
{
   var inputs = getFormInputs(form);
   for(var i = 0; i < inputs.length; i++)
      inputs[i].removeAttribute("disabled");
   var submit = form.querySelector("[type='submit']");
   submit.parentNode.removeChild(submit.parentNode.querySelector("[data-spinner]"));
}

//https://stackoverflow.com/a/6394168/1066474
function formIndex(obj,is, value) 
{
   if (typeof is == 'string')
   {
      return formIndex(obj,is.split('.'), value);
   }
   else
   {
      if(value !== undefined && !(is[0] in obj))
         obj[is[0]] = {};

      if (is.length==1 && value!==undefined)
         return obj[is[0]] = value;
      else if (is.length==0)
         return obj;
      else
         return formIndex(obj[is[0]],is.slice(1), value);
   }
}

function formSerialize(form, base)
{
   //TRY to get inputs by name, get values based on what kind they are.
   var inputs = form.querySelectorAll("[name]");
   var result = base || {};
   for(var i = 0; i < inputs.length; i++)
   {
      var elm = inputs[i];
      var tag = elm.tagName.toLowerCase();
      var name = elm.getAttribute('name');
      var val = undefined;
      if(tag === "input" || tag === "textarea" || tag==="select")
      {
         val = elm.value;
      }
      else if(elm.hasAttribute('data-value'))
      {
         val = elm.getAttribute("data-value");
      }
      else if(elm.hasAttribute("data-collection"))
      {
         val = elm.hasAttribute("data-keys") ? {} : [];
         [...elm.querySelectorAll("[data-collectionitem]")].forEach(x =>
         {
            var key = x.getAttribute('data-key');
            if(key)
               val[key] = x.getValue(x);
            else
               val.push(x.getValue(x));
         });
         //result[name] = val;
      }
      //Why are these opposite? Just badness: a "list" is something a USER
      //entered, so we accept both spaces and commas. But in general, we want
      //true lists to be separated by commas
      if(elm.hasAttribute("data-list"))
         val = val.replace(/,/g, " ").split(" ").filter(x => x);
      else if(elm.hasAttribute("data-condense"))
         val = val.join(","); //replace(/,/g, " ").split(" ").filter(x => x);
      formIndex(result, name, val);
   }
   return result;
}

function formFill(form, data)
{
   if(!data)
      return;

   //TRY to get inputs by name
   var inputs = form.querySelectorAll("[name]");
   for(var i = 0; i < inputs.length; i++)
   {
      var elm = inputs[i];
      var key = elm.getAttribute("name");
      var val = undefined;

      try
      {
         val = formIndex(data, key);
      }
      catch(ex)
      {
         DomDeps.log("FORM WARNING: can't fill field " + key + ": " + ex.message);
         continue;
      }

      if(val !== undefined)
      {
         var tag = elm.tagName.toLowerCase();
         if(tag === "input" || tag === "textarea" || tag==="select")
         {
            if(elm.hasAttribute("data-list"))
               val = val.join(" ");

            DomDeps.log("setting form " + key  + " to " + val);
            elm.value = val;
         }
      }
   }
}


// **********************
// --- PAGE CONSTANTS ---
// **********************

function getDiscussionId(id) { return "discussion-" + id; }
function getDiscussionSwitchId(id) { return "discussion-" + id + "-switch"; }
function getCommentId(id) { return "comment-" + id; }
function getWatchId(cid) { return "watchitem-" + cid; }
function getPulseId(cid) { return "pulseitem-" + cid; }

function getPWUserlist(pulseitem) { return pulseitem.querySelector(".pw-users"); }


// ***************
// --- SPECIAL ---
// ***************

// Usually we don't depend on outside data formats but this is special.

// Each option is required to have:
//  "def" (default) value
//  "value" the current value
// Optional fields are: 
//  "u" to signal it's a user setting
//  "text" field to show something nice for the setting
//  "type" to specify a special type of input for display 
//  "step" value for numeric inputs.

function renderOptions(options)
{
   DomDeps.log("Refreshing user options");

   userlocaloptions.innerHTML = "";
   developerlocaloptions.innerHTML = "";

   var lastType = false;

   //Set up options
   for(key in options)
   {
      var o = options[key];
      var prnt = userlocaloptions;
      var templn = o.type;
      let vconv = x => x;

      if(!o.u) //oops, this is a developer option
         prnt = developerlocaloptions;

      if(!templn)
      {
         var to = typeof o.def;
         if(to === "boolean") 
         {
            templn = "bool";
         }
         else if(to === "number") 
         {
            templn = "number";
            vconv = x => Number(x);
         }
         else if(o.options)
         {
            templn = "select";
         }
         else 
         {
            templn = "raw";
         }
      }

      let elm = cloneTemplate(templn + "option");
      let k = key;
      if(o.text) findSwap(elm, "data-name", "options." + k);
      if(o.options) findSwap(elm, "data-options", o.options);
      multiSwap(elm, { //PUT THIS LAST so input happens AFTEr options
         "data-text" : o.text || k,
         "data-input" : o.value
      });
      elm.onchange = e => { 
         var val = vconv(getSwap(elm, "data-input"));
         DomDeps.signal("localsettingupdate_event", 
            { key : k, value: val, options : options });
      };
      finalizeTemplate(elm);

      if(lastType && lastType !== templn)
         elm.className += " uk-margin-small-top";
      if(o.step)
         findSwap(elm, "data-step", o.step);

      lastType = templn;
      prnt.appendChild(elm);
   }

   DomDeps.signal("optionrender", options);
}

function displaySearchResults(container, results)
{
   if(results.length)
   {
      var list = container.querySelector("[data-results]");

      list.innerHTML = "";
      findSwap(container, "data-count", results.length);
      unhide(container);

      results.forEach(x => 
      {
         list.appendChild(makeSearchResult(x.type, x.imageLink, x.link, x.title, x.meta));
      });
   }
}

function displayMiniSearchResults(container, results, onSelect)
{
   container.innerHTML = "";

   if(results.length)
   {
      results.forEach(x => 
      {
         container.appendChild(makeMiniSearchResult(
            x.imageLink, x.name, () => onSelect(x)));
      });
   }
   else
   {
      var p = document.createElement("p");
      p.textContent="No results...";
      container.appendChild(p);
   }
}

// ************************
// --- DISCUSSION BASIC ---
// ************************

function getDiscussion(id)
{
   var discussion = document.getElementById(getDiscussionId(id));

   if(!discussion)
   {
      //TODO: is the template system allowed to be in here???
      discussion = Templates.LoadHere("discussion", { discussionid : id });
      discussion.template.fields.loadcommentsfunc = (event) =>
      {
         event.preventDefault();
         var tmpl = discussion.template;
         writeDom(() => { tmpl.fields.loadingcomments = true; });

         log.Info("Loading older messages in " + id);

         var minId = Number.MAX_SAFE_INTEGER;
         var msgs = tmpl.element.querySelectorAll('[data-template="messageframe"] [data-messageid]');

         for(var i = 0; i < msgs.length; i++)
         {
            var messageId = Number(msgs[i].getAttribute("data-messageid"));
            if(messageId > 0) minId = Math.min(minId, messageId);
         }

         var initload = getLocalOption("oldloadcomments");
         var params = new URLSearchParams();
         params.append("requests", "comment-" + JSON.stringify({
            Reverse : true,
            Limit : initload,
            ParentIds : [ Number(id) ],
            MaxId : Number(minId)
         }));
         params.append("requests", "user.0createUserId.0edituserId");

         globals.api.Chain(params, apidata =>
         {
            log.Datalog("check dev log for loadcomments: ", apidata);
            var data = apidata.data;
            var users = idMap(data.user);
            writeDom(() =>
            {
               //var oldHeight = discussions.scrollHeight;
               //var oldScroll = discussions.scrollTop;
               easyComments(data.comment, initload); //users);
               //discussions.scrollTop = discussions.scrollHeight - oldHeight + oldScroll;
            });
         }, undefined, apidata => /* always */
         {
            writeDom(() => {tmpl.fields.loadingcomments = false});
            //globals.loadingOlderDiscussions = false;
            //globals.loadingOlderDiscussionsTime = performance.now();
            //writeDom(() => hide(loading));
         });
      };
      //});
      discussion.id = getDiscussionId(id);

      //multiSwap(discussion, {
      //   "data-id": getDiscussionId(id),
      //   "data-discussionid": id
      //});

      //var loadolder = discussion.querySelector("[data-loadolder] [data-loadmore]");
      //loadolder.onclick = event => 
      //{
      //   event.preventDefault();
      //   DomDeps.signal("loadoldercomments_event", discussion);
      //};

      //finalizeTemplate(discussion);
      discussionmemory.appendChild(discussion);
   }

   return discussion;
}

function getActiveDiscussion() { return discussions.querySelector('[data-template="discussion"]'); }

function getActiveDiscussionId()
{
   var d = getActiveDiscussion();
   return d ? Number(d.template.fields.discussionid) : null;
}

function showDiscussion(id)
{
   //Hide the active discussion (TODO:should be renamed)
   hideDiscussion(true);
   
   //Reset it back to the top for consistent behavior
   //discussions.scrollTop = 0;

   var d = getDiscussion(id);
   discussions.appendChild(d);
   DomDeps.signal("showdiscussion", { id: id, discussion: d });
}

function hideDiscussion(quiet)
{
   var d = getActiveDiscussion();

   if(d)
   {
      [...d.querySelectorAll("[data-hideplayer]")].forEach(x => x.click());
      discussionmemory.appendChild(d);
      DomDeps.signal("hidediscussion", { discussion: d });
   }
   else if(!quiet)
   {
      DomDeps.log("Tried to hide discussion when none was shown");
   }
}

