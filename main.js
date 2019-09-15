//Carlos Sanchez
//9-11-2019

var CONST =
{
   Active : "data-active",
   Running : "data-running",
   MaxLogMessages : 5000,
   LogMessageEraseBuffer : 500,
   LogConsole : true,
   Api : "/api/"
};

CONST.UsersApi = CONST.Api + "users/";
CONST.AuthorizeApi = CONST.UsersApi + "authenticate/";
CONST.CategoriesApi = CONST.Api + "categories/";
CONST.ContentApi = CONST.Api + "content/";

var EMain = false;
var Log = CreateLogger(CONST.LogConsole, CONST.MaxLogMessages, CONST.LogMessageEraseBuffer);

$( document ).ready(function()
{
   Log.Info("Document ready: loading website");

   try
   {
      EMain = {
         LeftPane : $("#leftpane"),
         LeftScroller : $("#leftscroller"),
         RightPane : $("#rightpane"),
         SmallNav : $("#smallnav")
      };
      
      Log.Debug("Cached all desired elements");

      ResetSmallNav();
      EMain.SmallNav.children().first().click();
      RunBasicAjax(CONST.UsersApi);
   }
   catch(ex)
   {
      Log.Error("Could not setup website: " + ex);
   }

   Log.Info("Website loaded (pending content)");
});

function CreateHome()
{
   Log.Debug("Creating Homepage");

   var main = MakeContent("");
   var header = $("<h1>SmileBASIC Source</h1>");
   var about = $("<p></p>");
   about.text("One day, this might become something??? I've said that about " +
      "quite a few projects though... none of which went anywhere");
   var explain = $("<p></p>");
   explain.text("Some things: Yes, the sidebar will be collapsible and maybe " +
      "even resizable. No, nothing is final. No, I'm not focusing on ultra-old " +
      "devices first, although I am looking for it to be stable on at least " +
      "sort-of old things. Yes, I'm really using jquery, it's here to stay. " +
      "No, I'm not going to use 1 million libraries; just jquery and MAYBE one " +
      "or two other things. I'm trying to make the underlying html and css as " +
      "simple as possible to both understand and manipulate... I don't want to have a mess " +
      "just as much as anybody else trying to manipulate this crap.\n\nYes, I'm " +
      "trying to fit the entire website into one window. Yes, everything will " +
      "be AJAX and done through jquery (sorry non-js people). Yes, IF I get time, " +
      "I still plan on an 'ultra low-end no js' version of the website, but that's " +
      "only if people still need that after I'm finished with this one. Yes I'm " +
      "open to suggestions, but I'm trying to avoid feature creep so unless it's " +
      "super pressing, I might hold off on it. Yes, the website database gets " +
      "reset every time I publish; when the website WORKS I will stop doing " +
      "that.\n\n\nOh one more thing: this is running off a junky little " +
      "laptop at home with bad internet. Sorry if at any point it's bad.");
   main.append(header);
   main.append(about);
   main.append(explain);

   return main;
}

function CreateLogin()
{
   Log.Debug("Creating Login/Register page");

   var main = MakeContent();
   main.append(CreateLoginForm());
   main.append(CreateRegisterForm());
   main.append(CreateRegisterConfirmForm());

   return main;
}

function CreateLoginForm()
{
   var form = MakeStandaloneForm("Login");
   AddBeforeSubmit(MakeInput("username", "text", "Username/Email"), form);
   AddBeforeSubmit(MakeInput("password", "password", "Password"), form);
   SetupFormAjax(form, CONST.AuthorizeApi, GatherLoginValues);
   return form;
}

function CreateRegisterForm()
{
   var form = MakeStandaloneForm("Register");
   AddBeforeSubmit(MakeInput("email", "email", "Email"), form);
   AddBeforeSubmit(MakeInput("username", "text", "Username"), form);
   AddBeforeSubmit(MakeInput("password", "password", "Password"), form);
   AddBeforeSubmit(MakeInput("confirmpassword", "password", "Confirm Password"), form);
   SetupFormAjax(form, CONST.AuthorizeApi, GatherFormValues);
   return form;
}

function CreateRegisterConfirmForm()
{
   var form = MakeStandaloneForm("Confirm Registration", "Confirm");
   AddBeforeSubmit(MakeInput("code", "text", "Email Code"), form);
   SetupFormAjax(form, CONST.AuthorizeApi, GatherFormValues);
   return form;
}

// ****************************************
// * WARN: FUNCTIONS DEPENDING ON GLOBALS *
// ****************************************
//
// These are essentially scripts
 
function RunBasicAjax(url, data)
{
   return $.ajax(GetAjaxSettings(url, data)).done(function(data)
   {
      Log.Debug(url + " SUCCESS: " + JSON.stringify(data));
   }).fail(function(data)
   {
      Log.Error(url + " FAIL: " + JSON.stringify(data));
   });
}

function SetupFormAjax(form, url, dataConverter, success)
{
   var inputs = form.find("input, button, textarea");
   var submit = form.find("input[type='submit']");
   var startRunning = function() 
   { 
      inputs.prop('disabled', true);
      submit.attr(CONST.Running, ""); 
   };
   var stopRunning = function() 
   { 
      inputs.prop('disabled', false);
      submit.removeAttr(CONST.Running); 
   };

   if(!submit)
   {
      Log.Error("No 'submit' input on form for " + url);
      return;
   }

   form.submit(function()
   {
      try
      {
         startRunning();
         var ajax = RunBasicAjax(url, dataConverter(form));
         ajax.always(stopRunning);
         ajax.fail(function(data){SetFormError(form, data.responseText)});
         ajax.done(success);
      }
      catch(ex)
      {
         stopRunning();
         Log.Error("Exception during form submit:" + ex.message);
         SetFormError(form, ex.message);
      }
      return false;
   });
}

//Setting active CONTENT will update the left pane. Anything can be content...
function SetActiveContent(element, content)
{
   //One day this may also need to disable background ajax or whatever. It'll
   //need to do MORE than just set a singleton attribute for the entire right pane.
   SetSingletonAttribute(element, EMain.RightPane, CONST.Active);
   SetDisplayedContent(content);
}

function MakeSmallNavButton(icon, color, contentFunc)
{
   return MakeIconButton(icon, color, function(b)
   {
      try
      {
         SetActiveContent(b, contentFunc());
      }
      catch(ex)
      {
         Log.Warn("Could not click small nav button: " + ex);
      }
   });
}

function SetDisplayedContent(content)
{
   EMain.LeftScroller.empty();
   EMain.LeftScroller.append(content);
}

function AppendDisplayedContent(content)
{
   EMain.LeftScroller.append(content);
}

function ResetSmallNav()
{
   EMain.SmallNav.empty();

   EMain.SmallNav.append(MakeSmallNavButton("icons/home.png", "#77C877", CreateHome));
   EMain.SmallNav.append(MakeSmallNavButton("icons/debug.png", "#C8A0C8", Log.GetMessagesHtml));
   EMain.SmallNav.append(MakeSmallNavButton("icons/user.png", "#77AAFF", CreateLogin));

   Log.Debug("Reset mini navigation");
}
