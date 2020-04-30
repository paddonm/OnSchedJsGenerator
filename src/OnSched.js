// Main entry point for OnSched.js

function OnSched(ClientId, Environment, Scope) {

    var self = {};
    self.objectName = "OnSched";
    self.scope = Scope === null ? "OnSched Api" : Scope;
    self.clientId = ClientId;
    self.environment = Environment === null ? "live" : Environment;
    self.environment = self.environment === "live" || self.environment === "sbox" ? self.environment : "sbox";
    self.apiBaseUrl = self.environment === "live" ?
        "https://api.onsched.com/consumer/v1" :
        "https://sandbox-api.onsched.com/consumer/v1";
//    self.accessToken = OnSchedRest.GetAccessToken(self.environment);
    self.accessToken = OnSchedRest.Authorize(self.clientId, self.environment, self.scope);
    // Elements method that creates elements instance
    self.elements = function () {
        var elements = {};
        elements.objectName = "OnSched.elements";
        // elements.create method for creating an element
        elements.create = function (type, params, options) {
            var element = {};
            element.onsched = self;
            element.objectName = "OnSched.element";
            element.type = type;

            // check for params based on type? e.g. date is not relevant for all types
            element.params = params;
            element.options = options;

            ///
            /// element.mount method for mounting the created element in the DOM
            /// Much happens in the mount. API calls and templating of html.
            /// Bulk of exceptions likely to happen here.
            ///

            element.mount = function (id) {

                try {
                    element.id = id;

                    var el = document.getElementById(id);
                    // TODO - raise app error event
                    if (el === null)
                        throw "OnSched.mount: Element with id=" + id + " doesn't exist.";


                    switch (element.type) {
                        case "availability":
                            OnSchedMount.AvailabilityElement(this);
                            break;
                        case "customer":
                            OnSchedMount.CustomerElement(this);
                            break;
                        case "appointment":
                            OnSchedMount.AppointmentElement(this);
                            break;
                        case "confirmation":
                            OnSchedMount.ConfirmationElement(this);
                            break;
                        case "location":
                            OnSchedMount.LocationElement(this);
                            break;
                        case "locations":
                            OnSchedMount.LocationsElement(this);
                            break;
                        case "resource":
                            OnSchedMount.ResourceElement(this);
                            break;
                        case "resources":
                            OnSchedMount.ResourcesElement(this);
                            break;
                        case "service":
                            OnSchedMount.ServiceElement(this);
                            break;
                        case "services":
                            OnSchedMount.ServicesElement(this);
                            break;
                        case "search":
                            OnSchedMount.SearchElement(this);
                            break;
                        default:
                            // TODO - raise App error event
                            console.log("Unsupported element " + element.type);
                            html = "Unsupported element";
                            break;
                    }
                } catch (e) {
                    // TODO - raise error event to the app client
                    console.log("OnSched.mount failed id=" + element.id + " type=" + element.type);
                    console.log(e);
                }
            };

            element.update = function (params, options) {
                element.params = params != null ? params : element.params;
                element.options = options != null ? options : element.options;
                // I need to update DOM elements in cases like the search element
                if (element.type == "search") {
                    var elSearchText = document.querySelector(".onsched-search-form input[name=searchText]");
                    elSearchText.value = params.searchText !== null ? params.searchText : elSearchText.value;
                    elSearchText.placeholder = params.placeholder !== null ? params.placeholder : elSearchText.placeholder;
                    var elMessage = document.querySelector(".onsched-search-form p");
                    elMessage.textContent = params.message !== null ? params.message : elMessage.textContent;
                }
            };

            element.onChange = function (event) {
                OnSchedOnChange.OnChangeTimezone(event, element);
            };

            element.onClick = function (event) {
                if (event.target.classList.contains("day"))
                    OnSchedOnClick.CalendarDay(event, element);
                else
                if (event.target.classList.contains("time"))
                    OnSchedOnClick.AvailableTime(event, element);
                else
                if (event.target.classList.contains("list-item"))
                    OnSchedOnClick.ListItem(event, element);
                else
                if (event.target.classList.contains("month-prev"))
                    OnSchedOnClick.MonthPrev(event, element);
                else
                if (event.target.classList.contains("month-next"))
                    OnSchedOnClick.MonthNext(event, element);      
            };

            return element; // return a reference to the element object for chaining
        };


        return elements; // return a reference to the elements object for chaining
    };


    return self; // return reference to the OnSched object for chaining
}


var OnSchedMount = function () {

    function SearchElement(element) {
        var el = document.getElementById(element.id);
        el.innerHTML = OnSchedTemplates.searchForm(element.params);
        OnSchedHelpers.HideProgress();
        // wire up events
        var elSearchForm = document.querySelector(".onsched-search-form");
        elSearchForm.addEventListener("submit", function (e) {
            e.preventDefault(); // before the code
            var elSearchText = document.querySelector(".onsched-search-form input[type=text]");
            var eventModel = { searchText: elSearchText.value};
            var clickSearchEvent = new CustomEvent("clicked", { detail: eventModel });
            el.dispatchEvent(clickSearchEvent);
//            OnSchedHelpers.ShowProgress();
        });
    }

    function ServicesElement(element) {
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        url = element.onsched.apiBaseUrl + "/services";
        url = element.options.getFirst ? OnSchedHelpers.AddUrlParam(url, "limit", "1") : url;
        url = element.params.locationId !== null && element.params.locationId.length > 0 ?
            OnSchedHelpers.AddUrlParam(url, "locationId", element.params.locationId) : url;
        console.log(url);
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetServices(x, url, function (response) {
                var elServices = document.getElementById(element.id);
                var service = {};
                // need to add param to getById - pass serviceId as optional parameter
                // or is this a different element - service????
                if (element.options.getFirst) {
                    //
                    if (response.count > 0) {
                        service = response.data[0];
                        var getServiceEvent = new CustomEvent("getService", { detail: service });
                        elServices.dispatchEvent(getServiceEvent);
                    }
                }
                else {
                    var htmlServices = OnSchedTemplates.servicesList(response);
                    elServices.innerHTML = htmlServices;
                    // fire a custom event here
                    var eventModel = {
                        'object': response.object, 'hasMore': response.hasMore,
                        'count': response.count, 'total': response.total
                    };
                    var getServicesEvent = new CustomEvent("getServices", { detail: eventModel });
                    elServices.dispatchEvent(getServicesEvent);
                }

            })
        );
    }

    function LocationsElement(element) {
        // are there any params or just options for locations?
        // need to support lookup by postalCode. API changes.
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        url = element.onsched.apiBaseUrl + "/locations";
        //                        console.log(element.params);
        url = element.params.units != null ? OnSchedHelpers.AddUrlParam(url, "units", element.params.units) : url;
        url = element.params.offset != null ? OnSchedHelpers.AddUrlParam(url, "offset", element.params.offset) : url;
        url = element.params.limit != null ? OnSchedHelpers.AddUrlParam(url, "limit", element.params.limit) : url;
        url = OnSchedHelpers.AddUrlParam(url, "nearestTo", element.params.nearestTo);
        OnSchedHelpers.ShowProgress();
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetLocations(x, url, function (response) {
                var eventModel;
                var getLocationsEvent;
                if (response.error || response.count === 0) {
//                    console.log(response.code);
                    eventModel = { message: 'No locations found matching search input.', searchText: element.params.nearestTo };
                    getLocationsEvent = new CustomEvent("notFound", { detail: eventModel });
                    el.dispatchEvent(getLocationsEvent);
                    return;
                }
                var htmlLocations = OnSchedTemplates.locationsList(response);
                el.innerHTML = htmlLocations;
                // fire a custom event here
                eventModel = { 'object': response.object, 'hasMore': response.hasMore, 'count': response.count, 'total': response.total };
                getLocationsEvent = new CustomEvent("getLocations", { detail: eventModel });
                el.dispatchEvent(getLocationsEvent);

            })
        ).catch(e => console.log(e));
    }

    function AvailabilityElement(element) {
        // new approach will be to create the container, load it
        // then replace the calendar element within the container
        element.params.date = element.params.date == null ? new Date() : element.params.date;

        html = OnSchedTemplates.availabilityContainer();
        var el = document.getElementById(element.id);
        el.innerHTML = html;
        // Now wire up events on the calendar
        el.addEventListener("click", element.onClick);
        el.addEventListener("change", element.onChange);
//        console.log(element.params.tzOffset);
        var elTimezone = document.querySelector(".onsched-timezone .onsched-select");
        elTimezone.value = element.params.tzOffset;
//        console.log(elTimezone);
        // initialize the calendar using only the date which is lightening fast
        var elCalendar = document.querySelector(".onsched-calendar");
        elCalendar.innerHTML = OnSchedTemplates.calendarSelectorFromDate(element.params.date);
        var elTimes = document.querySelector(".onsched-available-times");
        elTimes.innerHTML = "";
        var url = OnSchedHelpers.CreateAvailabilityUrl(element.onsched.apiBaseUrl, element.params);

        // calculate available days to pull when mounting
        url = OnSchedHelpers.AddUrlParam(url, "dayAvailabilityStartDate",
            OnSchedHelpers.CreateDateString(OnSchedHelpers.GetFirstCalendarDate(element.params.date)));
        url = OnSchedHelpers.AddUrlParam(url, "dayAvailability", 100);
        url = OnSchedHelpers.AddUrlParam(url, "firstDayAvailable", "true");

        var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
        var dateSelectedTitle = element.params.date.toLocaleDateString(
            "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        elDateSelected.title = dateSelectedTitle;

        var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
        elDow.innerHTML = element.params.date.toLocaleDateString("en-US", { weekday: 'short' });
        var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
        elDay.innerHTML = element.params.date.toLocaleDateString("en-US", { day: 'numeric' });

        element.onsched.accessToken.then(x =>
            OnSchedRest.GetAvailability(x, url, function (response) {
                if (response.error) {
                    console.log("Response Error: "+response.code);
                    return;
                }
//                console.log(response.firstAvailableDate);
                // I need to update the calendar html from the availbleDays info in the response
                // I need to use the FirstAvailableDate in the response if is returned
                var selectedDate = response.firstAvailableDate.length > 0 ?
                    OnSchedHelpers.ParseDate(response.firstAvailableDate) : element.params.date;
                var days = OnSchedHelpers.GetCalendarDays(selectedDate);
                var availableDays = response.availableDays.length > days ? response.availableDays.slice(0, days) : response.availableDays;
                var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
                var dateSelectedTitle = selectedDate.toLocaleDateString(
                    "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                elDateSelected.title = dateSelectedTitle;
                var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
                elDow.innerHTML = selectedDate.toLocaleDateString("en-US", { weekday: 'short' });
                var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
                elDay.innerHTML = selectedDate.toLocaleDateString("en-US", { day: 'numeric' });

                var elCalendar = document.querySelector(".onsched-calendar");
                elCalendar.innerHTML = OnSchedTemplates.calendarSelector(availableDays, selectedDate);

                var elBusinessName = document.querySelector(".onsched-available-times-header .onsched-business-name");
                elBusinessName.innerHTML = response.businessName;

                var elServiceName = document.querySelector(".onsched-available-times-header .onsched-service-name");
                elServiceName.innerHTML = response.serviceName;

                var elServiceDuration = document.querySelector(".onsched-available-times-header .onsched-service-duration");
                var resourceName = response.resourceName;
                var durationAndResource = OnSchedHelpers.FormatDuration(response.serviceDuration);
                if (!OnSchedHelpers.IsEmpty(resourceName))
                    durationAndResource += " - " + resourceName;
                elServiceDuration.innerHTML = durationAndResource;
                var htmlTimes = OnSchedTemplates.availableTimes2(response, element.params.date, element.params.customerId);
                var elTimes = document.querySelector(".onsched-available-times");
                elTimes.innerHTML = htmlTimes;
            })
        );
    }

    function CustomerElement(element) {
        // When I mount customer and have everything, I can immediately do a customer post
        // then I can fire an event and return the customerId created.
        // Normal flow, form loads on mount and wait for a Submit
        // Alternate flow, customer data exists so just POST the customer with supplied data
        // It still happens on mount because I also need to send event back to the customer element
        // What if the same customer booking second time around. Avalailability could provide the 
        // customerId. 
        url = element.onsched.apiBaseUrl + "/customers";
        url = OnSchedHelpers.AddUrlParam(url, "locationId", element.params.locationId);
        url = OnSchedHelpers.AddUrlParam(url, "email", element.params.email);
        console.log(url);
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetCustomers(x, url, function (response) {
                //                                console.log(response);
                if (response.count == 0) {
                    // here is where I may need to do a POST to create the customer
                    if (element.params.customerIM != null) {
                        console.log(element.params.customerIM);
                        url = element.onsched.apiBaseUrl + "/customers";
                        element.onsched.accessToken.then(x =>
                            OnSchedRest.PostCustomer(x, url, element.params.customerIM, function (response) {
                                //                                                console.log(response);
                                var createCustomerEvent = new CustomEvent("postCustomer", { detail: response });
                                var elCustomer = document.getElementById(element.id);
                                elCustomer.dispatchEvent(createCustomerEvent);
                            })
                        );
                    }
                    else
                        throw new Error("Customer not found");
                }
                if (response.count > 0) {
                    // fire a custom event here
                    var getCustomerEvent = new CustomEvent("getCustomer", { detail: response.data[0] });
                    var elCustomer = document.getElementById(element.id);
                    elCustomer.dispatchEvent(getCustomerEvent);
                }
            })
        );
    }

    function LocationElement(element) {
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        var url = element.onsched.apiBaseUrl + "/locations/" + element.params.locationId;

        if (element.params.locationId === null || element.params.locationId.length === 0)
            return;

        // We build a url so call the endpoint now
        element.onsched.accessToken.then(x =>
            OnSchedRest.Get(x, url, function (response) {
                var getLocationEvent = new CustomEvent("getLocation", { detail: response });
                el.dispatchEvent(getLocationEvent);
            }) // end rest response
        ); // end promise
        return;
    }
    function AppointmentElement(element) {
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        var url = element.onsched.apiBaseUrl + "/appointments/" + element.params.appointmentId;

        if (element.params.appointmentId === null || element.params.appointmentId.length === 0)
            return;

        // We build a url so call the endpoint now
        element.onsched.accessToken.then(x =>
            OnSchedRest.Get(x, url, function (response) {
                var getAppointmentEvent = new CustomEvent("getAppointment", { detail: response });
                el.dispatchEvent(getAppointmentEvent);
            }) // end rest response
        ); // end promise
        return;
    }

    function ConfirmationElement(element) {
        console.log("creating confirmation element in mount");
        console.log(element.params);
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        if (element.params.appointment === null)
            return;
        // render the bitch with a template. element.params.appointment object
        console.log(el);
        console.log(OnSchedTemplates.confirmation(element.params.appointment));
        el.innerHTML = OnSchedTemplates.confirmation(element.params.appointment);
        console.log(el);
    }

    function ServiceElement(element) {
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
//        url = element.onsched.apiBaseUrl + "/services/" + element.params.serviceId;

        // url depends on getFirst or by serviceId
        if (element.params.serviceId != null && element.params.serviceId.length > 0) {
            url = element.onsched.apiBaseUrl + "/services/" + element.params.serviceId;
        }
        else
        if (element.params.getFirst) {
            url = element.onsched.apiBaseUrl + "/services";
            url = element.params.getFirst ? OnSchedHelpers.AddUrlParam(url, "limit", "1") : url;

        }
        else
            return;

        url = element.params.locationId != null && element.params.locationId.length > 0 ?
            OnSchedHelpers.AddUrlParam(url, "locationId", element.params.locationId) : url;
        console.log(url);

        // We build a url so call the endpoint now
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetServices(x, url, function (response) {
                var getServiceEvent;
                var elService;
                if (response.object == "service") {
                    elService = document.getElementById(element.id);
                    getServiceEvent = new CustomEvent("getService", { detail: response });
                    elService.dispatchEvent(getServiceEvent);
                }
                else {
                    elService = document.getElementById(element.id);
                    if (response.count > 0) {
                        var service = response.data[0]; // take the first service returned
                        getServiceEvent = new CustomEvent("getService", { detail: service });
                        elService.dispatchEvent(getServiceEvent);
                    }
                }
            }) // end rest response
        ); // end promise
        return;
    }

    function ResourcesElement(element) {
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        url = element.onsched.apiBaseUrl + "/resources";
        url = element.options.getFirst ? OnSchedHelpers.AddUrlParam(url, "limit", "1") : url;
        console.log(url);
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetResources(x, url, function (response) {
                var elResources = document.getElementById(element.id);
                var resource;
                // need to add param to getById - pass serviceId as optional parameter
                // or is this a different element - service????
                if (element.options.getFirst) {
                    //
                    if (response.count > 0) {
                        resource = response.data[0];
                        var getResourceEvent = new CustomEvent("getResource", { detail: service });
                        elResources.dispatchEvent(getResourceEvent);
                    }
                }
                else {
                    var htmlResources = OnSchedTemplates.resourcesList(response);
                    elResources.innerHTML = htmlResources;
                    // fire a custom event here
                    var eventModel = {
                        'object': response.object, 'hasMore': response.hasMore,
                        'count': response.count, 'total': response.total
                    };
                    var getResourcesEvent = new CustomEvent("getResources", { detail: eventModel });
                    elResources.dispatchEvent(getResourcesEvent);
                }
            })
        );
    }
    function ResourceElement(element) {
        var el = document.getElementById(element.id);
        el.addEventListener("click", element.onClick);
        // url depends on getFirst or by serviceId
        if (element.params.resourceId != null && element.params.resourceId.length > 0)
            url = element.onsched.apiBaseUrl + "/resources/" + element.params.resourceId;
        else
        if (element.params.getFirst) {
            url = element.onsched.apiBaseUrl + "/resources";
            url = element.params.getFirst ? OnSchedHelpers.AddUrlParam(url, "limit", "1") : url;
        }
        else
            return;
        url = element.params.locationId != null && element.params.locationId.length > 0 ?
            OnSchedHelpers.AddUrlParam(url, "locationId", element.params.locationId) : url;

        // We build a url so call the endpoint now
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetResources(x, url, function (response) {
                var getResourceEvent;
                var elResource = document.getElementById(element.id);
                if (response.object == "resource") {
                    getResourceEvent = new CustomEvent("getResource", { detail: response });
                    elResource.dispatchEvent(getResourceEvent);
                }
                else {
                    if (response.count > 0) {
                        var resource = response.data[0]; // take the first service returned
                        getResourceEvent = new CustomEvent("getResource", { detail: resource });
                        elResource.dispatchEvent(getResourceEvent);
                    }
                }
            }) // end rest response
        ); // end promise
    } // End OnSchedElements

    return {
        SearchElement: SearchElement,
        LocationsElement: LocationsElement,
        ServicesElement: ServicesElement,
        ResourcesElement: ResourcesElement,
        AvailabilityElement: AvailabilityElement,
        CustomerElement: CustomerElement,
        LocationElement: LocationElement,
        AppointmentElement: AppointmentElement,
        ConfirmationElement: ConfirmationElement,
        ServiceElement: ServiceElement,
        ResourceElement: ResourceElement
    };
}(); // End OnSchedMount

///
///     OnSchedOnChange
///     Element processing for change events
///
var OnSchedOnChange = function () {

    function OnChangeTimezone(event, element) {
        var el = event.target;
        var tzOffset = event.target.options[el.selectedIndex].value;
        element.params["tzOffset"] = tzOffset;
        var elSelectedDate = document.querySelector(".onsched-calendar .day.selected");
        var selectedDate = OnSchedHelpers.ParseDate(elSelectedDate.dataset.date);
        var url = OnSchedHelpers.CreateAvailabilityUrl(element.onsched.apiBaseUrl, element.params, selectedDate);
        console.log(url);
        var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
        var dateSelectedTitle = selectedDate.toLocaleDateString(
            "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        dateSelectedTitle += " " + selectedDate.toTimeString();
        elDateSelected.title = dateSelectedTitle;
        OnSchedHelpers.ShowProgress();

        element.onsched.accessToken.then(x =>
            OnSchedRest.GetAvailability(x, url, function (response) {
                var htmlTimes = OnSchedTemplates.availableTimes2(response, selectedDate, element.params.customerId);
                var elTimes = document.querySelector(".onsched-available-times");
                elTimes.innerHTML = htmlTimes;
            })
        );
    }
    return {
        OnChangeTimezone: OnChangeTimezone
    };
}();

///
///     OnSchedOnClick
///     Element processing for click handling
///

var OnSchedOnClick = function () {

    function CalendarDay(event, element) {
        var dayClicked = event.target;
        // implement logic here to switch the selection in UI and trigger availability call
        var calendarDays = document.querySelectorAll(".onsched-calendar-rowgroup .day");
        [].forEach.call(calendarDays, function (el) {
            el.className = el.className.replace(/\bselected\b/g, "");
            // el.classList.remove("selected");
        });

        // call logic to unselect the selected day and reselect it with the clicked element
        if (dayClicked.classList.contains("selected"))
            console.log("already selected");
        else
            dayClicked.classList.add("selected");

        var title = document.querySelector(".onsched-calendar-header .onsched-calendar-title");
        var clickedDate = OnSchedHelpers.ParseDate(dayClicked.dataset.date);
        var rebuildCalendar = clickedDate.getMonth() != title.dataset.month || clickedDate.getFullYear() != title.dataset.year;
        var url = OnSchedHelpers.CreateAvailabilityUrl(element.onsched.apiBaseUrl, element.params, clickedDate);
        if (clickedDate.getMonth() != title.dataset.month || clickedDate.getFullYear() != title.dataset.year) {
            calendarHtml = OnSchedTemplates.calendarSelectorFromDate(clickedDate);
            var elCalendar = document.querySelector(".onsched-calendar");
            elCalendar.innerHTML = calendarHtml;

            // calculate available days to pull when mounting
            url = OnSchedHelpers.AddUrlParam(url, "dayAvailabilityStartDate",
                OnSchedHelpers.CreateDateString(OnSchedHelpers.GetFirstCalendarDate(clickedDate)));
            url = OnSchedHelpers.AddUrlParam(url, "dayAvailability", OnSchedHelpers.GetCalendarDays(clickedDate));

        }
        var elTimes = document.querySelector(".onsched-available-times");
        elTimes.innerHTML = "";

        var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
        elDow.innerHTML = clickedDate.toLocaleDateString("en-US", { weekday: 'short' });
        var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
        elDay.innerHTML = clickedDate.toLocaleDateString("en-US", { day: 'numeric' });
        var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
        var dateSelectedTitle = clickedDate.toLocaleDateString(
            "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        dateSelectedTitle += " " + clickedDate.toTimeString();
        elDateSelected.title = dateSelectedTitle;

        OnSchedHelpers.ShowProgress();
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetAvailability(x, url, function (response) {
                var elCalendar = document.querySelector(".onsched-calendar");
                if (url.indexOf("dayAvailabilityStartDate") != -1)
                    elCalendar.innerHTML = OnSchedTemplates.calendarSelector(response.availableDays, clickedDate);
                var elBusinessName = document.querySelector(".onsched-business-name");
                elBusinessName.innerHTML = response.businessName;
                var elServiceName = document.querySelector(".onsched-available-times-header .onsched-service-name");
                elServiceName.innerHTML = response.serviceName;
                var elServiceDuration = document.querySelector(".onsched-available-times-header .onsched-service-duration");
                var resourceName = response.resourceName;
                var durationAndResource = OnSchedHelpers.FormatDuration(response.serviceDuration);
                if (!OnSchedHelpers.IsEmpty(resourceName))
                    durationAndResource += " - " + resourceName;
                elServiceDuration.innerHTML = durationAndResource;

//                        var elServiceDescription = document.querySelector(".onsched-available-times-header .onsched-service-description");
//                        elServiceDescription.innerHTML = response.serviceDescription;
                var htmlTimes = OnSchedTemplates.availableTimes2(response, clickedDate, element.params.customerId);
                var elTimes = document.querySelector(".onsched-available-times");
                elTimes.innerHTML = htmlTimes;
            })
        );
    }

    function AvailableTime(event, element) {

        var timeClicked = event.target;

        // TWO DIFFERENT FLOWS ARE POSSIBLE
        // 1. Inform the client of the timeClicked. Client then renders booking form.
        //    client then does a PUT Book upon completion of the booking form
        // 2. Complete the booking, have enough information

        // TODO - complete flow 1. Flow 2 finished.

        var postData = new Object();
        postData.locationId = element.params.locationId;
        postData.serviceId = "" + element.params.serviceId;
        postData.resourceId = "" + timeClicked.dataset.resourceid;
        postData.startDateTime = timeClicked.dataset.startdatetime;
        postData.endDateTime = timeClicked.dataset.enddatetime;
        postData.customerId = element.params.customerId;
        OnSchedHelpers.ShowProgress();
        // Invoke POST /appointments endpoint
        var appointmentsUrl = element.onsched.apiBaseUrl + "/appointments";
        // TODO HANDLE POST to IN Status or Complete the booking
        // NEED AN AVAILABILITY PARAM OR OPTION TO DRIVE THIS
        // WHEN COMPLETING I NEED TO FIRE completeBooking event to the client.

        // I have to pull this outside in the script
        appointmentsUrl = OnSchedHelpers.AddUrlParam(appointmentsUrl, "completeBooking", "BK");
        console.log(postData);
        element.onsched.accessToken.then(x =>
            OnSchedRest.PostAppointment(x, appointmentsUrl, postData, function (response) {
                console.log(element.params);
                console.log(response);
                // remove the time that was clicked on because no longer available
                // ** may have to hide so when cancel out of form make visible again
                //                        if (event.target.dataset.slots == 1)
                //                            event.target.style.display = "none";

                /*
                                        if (element.params.customerId != null && element.params.customerId > 0) {
                                            var putAppointmentUrl = self.apiBaseUrl + "/appointments/" + response.id + "/book";
                                            console.log("PUT Appointment " + putAppointmentUrl);
                                            var payload = { name: response.name, email: response.email, phone: response.phone, phoneType: response.phoneType };
                                            console.log(payload);
                                        }
                */
                // prob event to fire here is postAppointment or BookingComplete event but send to availability

                // Fire event to the element to notify of booking complete
                var elAvailability = document.getElementById(element.id);
                var bookingConfirmationEvent = new CustomEvent("bookingConfirmation", { detail: response });
                elAvailability.dispatchEvent(bookingConfirmationEvent);

                // Load the booking form with the appointmentId
            })
        );

//                return element; // return a reference to the element object for chaining
    }

    function MonthPrev(event, element) {

        var firstDayDate = OnSchedHelpers.ParseDate(event.target.dataset.firstday);
        var prevDate = OnSchedHelpers.AddDaysToDate(firstDayDate, -1);
        prevDate = OnSchedHelpers.FirstDayOfMonth(prevDate);

        var url = OnSchedHelpers.CreateAvailabilityUrl(element.onsched.apiBaseUrl, element.params, prevDate);

        var calendarHtml = OnSchedTemplates.calendarSelectorFromDate(prevDate);
        var elCalendar = document.querySelector(".onsched-calendar");
        elCalendar.innerHTML = calendarHtml;
        // calculate available days to pull when mounting
        url = OnSchedHelpers.AddUrlParam(url, "dayAvailabilityStartDate",
            OnSchedHelpers.CreateDateString(OnSchedHelpers.GetFirstCalendarDate(prevDate)));
        url = OnSchedHelpers.AddUrlParam(url, "dayAvailability", OnSchedHelpers.GetCalendarDays(prevDate));
        url = OnSchedHelpers.AddUrlParam(url, "firstDayAvailable", "true");
        var elTimes = document.querySelector(".onsched-available-times");
        elTimes.innerHTML = "";

        var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
        elDow.innerHTML = prevDate.toLocaleDateString("en-US", { weekday: 'short' });
        var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
        elDay.innerHTML = prevDate.toLocaleDateString("en-US", { day: 'numeric' });
        var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
        var dateSelectedTitle = prevDate.toLocaleDateString(
            "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        dateSelectedTitle += " " + prevDate.toTimeString();
        elDateSelected.title = dateSelectedTitle;

        OnSchedHelpers.ShowProgress();
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetAvailability(x, url, function (response) {

                var selectedDate = response.firstAvailableDate.length > 0 ?
                    OnSchedHelpers.ParseDate(response.firstAvailableDate) : prevDate;

                var days = OnSchedHelpers.GetCalendarDays(selectedDate);
                var availableDays = response.availableDays.length > days ? response.availableDays.slice(0, days) : response.availableDays;
                var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
                elDow.innerHTML = selectedDate.toLocaleDateString("en-US", { weekday: 'short' });
                var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
                elDay.innerHTML = selectedDate.toLocaleDateString("en-US", { day: 'numeric' });
                var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
                var dateSelectedTitle = selectedDate.toLocaleDateString(
                    "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                elDateSelected.title = dateSelectedTitle;

                // Here is where I have to update the DOM with the dateSelected. Could be different from firstAvailableDate
                var calendarHtml = OnSchedTemplates.calendarSelector(availableDays, selectedDate);
                var elCalendar = document.querySelector(".onsched-calendar");
                elCalendar.innerHTML = calendarHtml;

                var elBusinessName = document.querySelector(".onsched-business-name");
                elBusinessName.innerHTML = response.businessName;

                var elServiceName = document.querySelector(".onsched-available-times-header .onsched-service-name");
                elServiceName.innerHTML = response.serviceName;

                var elServiceDuration = document.querySelector(".onsched-available-times-header .onsched-service-duration");
                var resourceName = response.resourceName;
                var durationAndResource = OnSchedHelpers.FormatDuration(response.serviceDuration);
                if (!OnSchedHelpers.IsEmpty(resourceName))
                    durationAndResource += " - " + resourceName;
                elServiceDuration.innerHTML = durationAndResource;

                //                        var elServiceDescription = document.querySelector(".onsched-available-times-header .onsched-service-description");
                //                        elServiceDescription.innerHTML = response.serviceDescription;

                var htmlTimes = OnSchedTemplates.availableTimes2(response, prevDate, element.params.customerId);
                var elTimes = document.querySelector(".onsched-available-times");
                elTimes.innerHTML = htmlTimes;
            })
        );
    }

    function MonthNext(event, element) {

        var lastDayDate = OnSchedHelpers.ParseDate(event.target.dataset.lastday);
        var nextDate = OnSchedHelpers.AddDaysToDate(lastDayDate, 1);
        var url = OnSchedHelpers.CreateAvailabilityUrl(element.onsched.apiBaseUrl, element.params, nextDate);

        var calendarHtml = OnSchedTemplates.calendarSelectorFromDate(nextDate);
        var elCalendar = document.querySelector(".onsched-calendar");
        elCalendar.innerHTML = calendarHtml;

        // calculate available days to pull when mounting
        url = OnSchedHelpers.AddUrlParam(url, "dayAvailabilityStartDate",
            OnSchedHelpers.CreateDateString(OnSchedHelpers.GetFirstCalendarDate(nextDate)));
        url = OnSchedHelpers.AddUrlParam(url, "dayAvailability", OnSchedHelpers.GetCalendarDays(nextDate));
        url = OnSchedHelpers.AddUrlParam(url, "firstDayAvailable", "true");

        var elTimes = document.querySelector(".onsched-available-times");
        elTimes.innerHTML = "";

        var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
        elDow.innerHTML = nextDate.toLocaleDateString("en-US", { weekday: 'short' });
        var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
        elDay.innerHTML = nextDate.toLocaleDateString("en-US", { day: 'numeric' });
        var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
        var dateSelectedTitle = nextDate.toLocaleDateString(
            "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        dateSelectedTitle += " " + nextDate.toTimeString();
        elDateSelected.title = dateSelectedTitle;

        OnSchedHelpers.ShowProgress();
        element.onsched.accessToken.then(x =>
            OnSchedRest.GetAvailability(x, url, function (response) {

                var selectedDate = response.firstAvailableDate.length > 0 ?
                    OnSchedHelpers.ParseDate(response.firstAvailableDate) : nextDate;

                var days = OnSchedHelpers.GetCalendarDays(selectedDate);
                var availableDays = response.availableDays.length > days ? response.availableDays.slice(0, days) : response.availableDays;
                var elDow = document.querySelector(".onsched-available-times-header .date-selected .dow");
                elDow.innerHTML = selectedDate.toLocaleDateString("en-US", { weekday: 'short' });
                var elDay = document.querySelector(".onsched-available-times-header .date-selected .day");
                elDay.innerHTML = selectedDate.toLocaleDateString("en-US", { day: 'numeric' });
                var elDateSelected = document.querySelector(".onsched-available-times-header .date-selected");
                var dateSelectedTitle = selectedDate.toLocaleDateString(
                    "en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                elDateSelected.title = dateSelectedTitle;

                // Here is where I have to update the DOM with the dateSelected. Could be different from firstAvailableDate
                var calendarHtml = OnSchedTemplates.calendarSelector(availableDays, selectedDate);
                var elCalendar = document.querySelector(".onsched-calendar");
                elCalendar.innerHTML = calendarHtml;

                var elBusinessName = document.querySelector(".onsched-business-name");
                elBusinessName.innerHTML = response.businessName;

                var elServiceName = document.querySelector(".onsched-available-times-header .onsched-service-name");
                elServiceName.innerHTML = response.serviceName;

                var elServiceDuration = document.querySelector(".onsched-available-times-header .onsched-service-duration");
                var resourceName = response.resourceName;
                var durationAndResource = OnSchedHelpers.FormatDuration(response.serviceDuration);
                if (!OnSchedHelpers.IsEmpty(resourceName))
                    durationAndResource += " - " + resourceName;
                elServiceDuration.innerHTML = durationAndResource;

                //                        var elServiceDescription = document.querySelector(".onsched-available-times-header .onsched-service-description");
                //                        elServiceDescription.innerHTML = response.serviceDescription;

                var htmlTimes = OnSchedTemplates.availableTimes2(response, nextDate, element.params.customerId);
                var elTimes = document.querySelector(".onsched-available-times");
                elTimes.innerHTML = htmlTimes;
            })
        );
    }

    function ListItem(event, element) {
        var itemClicked = event.target;
        // fire a custom event to element
        var eventModel;
        var elementType = itemClicked.dataset.element;
        if (elementType == "locations") {
            eventModel = { locationId: itemClicked.dataset.id };
            var elLocations = document.getElementById(element.id);
            var getLocationsEvent = new CustomEvent("clickLocation", { detail: eventModel });
            elLocations.dispatchEvent(getLocationsEvent);
        }
        else
        if (elementType == "services") {
            eventModel = { serviceId: itemClicked.dataset.id };
            var elServices = document.getElementById(element.id);
            var getServicesEvent = new CustomEvent("clickService", { detail: eventModel });
            elServices.dispatchEvent(getServicesEvent);
        }
    }
    return {
        CalendarDay: CalendarDay,
        AvailableTime: AvailableTime,
        MonthPrev: MonthPrev,
        MonthNext: MonthNext,
        ListItem: ListItem
    };
}();

///
///     OnSchedHelpers
///     Misc helper functions used in various element processing
///

var OnSchedHelpers = function () {

    function IsEmpty(val) {
        return (val === undefined || val == null || val.length <= 0) ? true : false;
    }
    function GetFunctionName(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    function GetUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function CreateAvailabilityUrl(baseUrl, params, date, tzOffset) {
        var startDate = date == null ? params.date : date;
        var endDate = date == null ? params.date : date;
        url = baseUrl;
        url += "/" + "availability";
        url += "/" + params.serviceId;
        url += "/" + CreateDateString(startDate);
        url += "/" + CreateDateString(endDate);
        url = OnSchedHelpers.IsEmpty(params.tzOffset) ? url : AddUrlParam(url, "tzOffset", params.tzOffset);
        url = OnSchedHelpers.IsEmpty(params.resourceId) ? url : AddUrlParam(url, "resourceId", params.resourceId);
        return url;
    }
    function AddUrlParam(url, name, value) {
        if (value == null)
            return url;
        if (url.indexOf("?") !== -1)
            url += "&" + name + "=" + value;
        else
            url += "?" + name + "=" + value;
        return url;
    }
    function ParseDate(dateString) {
        var utcDate = new Date(Date.parse(dateString));
        var date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        return date;
    }
    function CreateDateString(date) {
        var dateString = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
        return dateString;
    }

    function FirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    function LastDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
    function AddDaysToDate(inputDate, days) {
        var date = new Date(inputDate);
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        return date;
    }
    function GetFirstCalendarDate(date) {
        // first get the beginning of month
        // then go backwards to sunday
        var firstDayOfMonth = FirstDayOfMonth(date);
        var dow = firstDayOfMonth.getDay();
        var weekStartDate = AddDaysToDate(firstDayOfMonth, -dow);
        return weekStartDate;
    }
    function GetCalendarDays(date) {
        var totalCalendarWeeks = GetCalendarWeeks(date);
        return totalCalendarWeeks * 7;
    }
    function GetCalendarWeeks(date) {
        var firstDay = FirstDayOfMonth(date);
        var lastDay = LastDayOfMonth(date);

        var dow = firstDay.getDay();
        var displayableMonthDaysWeekOne = 7 - dow;
        var remainingDisplayableDays = lastDay.getDate() - displayableMonthDaysWeekOne;
        var remainingDisplayableWeeks = Math.floor(remainingDisplayableDays / 7) + (remainingDisplayableDays % 7 > 0 ? 1 : 0);
        var totalDisplayableWeeks = remainingDisplayableWeeks + 1;
        return totalDisplayableWeeks;
    }
    function ShowProgress() {
        var indicators = document.getElementsByClassName("onsched-progress");
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].style.display = "block";
        }
    }
    function HideProgress() {
        var indicators = document.getElementsByClassName("onsched-progress");
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].style.display = "none";
        }
    }
    function FormatServiceDescription(response) {
        var result = response.serviceName;
        result += " ";
        result += FormatDuration(response.serviceDuration);
        if (response.resourceName.length > 0)
            result += " - " + response.resourceName;
        return result;
    }
    function FormatTime(time) {
        if (time == null)
            return "";
        var hour = Math.floor(time / 100);
        var min = time % 100;
        var ampm = hour >= 12 ? "pm" : "am";
        hour = hour > 12 ? hour - 12 : hour;
        var minsString = min.toString();
        minsString = minsString.length < 2 ? minsString + "0" : minsString;
        //        var fmtTime = String.format("{0}:{1} {2}", hour, minsString, ampm);
        var fmtTime = hour + ":" + minsString + " " + ampm;
        return fmtTime;
    }
    function FormatDuration(duration) {
        var formatted = "none";
        if (duration === null)
            return formatted;

        if (duration <= 0)
            return formatted;
        else
            if (duration > 90 && duration % 60 > 0)
                formatted = duration / 60 + " hours" + duration % 60 + " min";
            else if (duration > 90)
                formatted = duration / 60 + " hours";
            else
                formatted = duration + " min";

        return formatted;
    }
    function StartBookingTimer(timerSecs) {
        try {
            // Initialize here before timer kicks in
            if (timerId != null)
                clearInterval(timerId);
            timerSecs = timerSecs == null ? 120 : timerSecs;
            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(timerSecs);
            today.setMilliseconds(0);
            $("#booking-timer").text(today.toString("m:ss"));
            timerId = setInterval(
                function () {
                    var mins = today.getMinutes();
                    var secs = today.getSeconds();
                    $("#booking-timer").text(today.toString("m:ss"));
                    mins = today.getMinutes();
                    secs = today.getSeconds() - 1;
                    today.setMinutes(secs > 60 ? mins - 1 : mins);
                    today.setSeconds(secs > 60 ? 0 : secs);
                }, 1000);
            return timerId;
        } catch (e) {
            OnSchedule.LogException(filename, "StartBookingTimer", e);
        }
    } // StartBookingTimer

    async function SetToken(token) {
        return token;
    }

    return {
        IsEmpty: IsEmpty,
        GetFunctionName: GetFunctionName,
        GetUrlParameter: GetUrlParameter,
        CreateAvailabilityUrl: CreateAvailabilityUrl,
        AddUrlParam: AddUrlParam,
        ParseDate: ParseDate,
        CreateDateString: CreateDateString,
        GetFirstCalendarDate: GetFirstCalendarDate,
        GetCalendarDays: GetCalendarDays,
        GetCalendarWeeks: GetCalendarWeeks,
        FirstDayOfMonth: FirstDayOfMonth,
        LastDayOfMonth: LastDayOfMonth,
        AddDaysToDate: AddDaysToDate,
        ShowProgress: ShowProgress,
        HideProgress: HideProgress,
        FormatServiceDescription: FormatServiceDescription,
        FormatTime: FormatTime,
        FormatDuration: FormatDuration,
        StartBookingTimer: StartBookingTimer,
        SetToken: SetToken,
    };

}(); // End OnSchedHelpers

// Create an object to return templates

var OnSchedTemplates = function () {
    function availabilityContainer() {
        const markup = `
    <div class="onsched-container onsched-availability">
        <div class="onsched-row">
            <div class="onsched-col">
                <div class="onsched-business-name" style="display:none">&nbsp;</div>
                <div class="onsched-available-times-header">
                    <div class="date-selected">
                        <div class="dow">Tue</div>
                        <div class="day">24</div>
                    </div>
                    <div>
                        <div class="onsched-business-name" style="display:none">&nbsp;</div>
                        <div class="onsched-calendar-prompt" style="">Select a Date & Time</div>
                        <div class="onsched-service-name"></div>
                        <div class="onsched-service-duration">30 min</div>
                        <div class="onsched-service-description" style="display:none">General assessment of patient for Hypertension</div>
                    </div>
                </div>
                <div class="onsched-calendar"></div>
                <div class="onsched-timezone">
                    <select class="onsched-select">
                        <option value="-420">Pacific Daylight Time (UTC-07:00)</option>
                        <option value="-360">Mountain Daylight Time (UTC-06:00)</option>
                        <option value="-300">Central Daylight Time (UTC-05:00)</option>
                        <option value="-240">Eastern Daylight Time (UTC-04:00)</option>
                    </select>
                </div>
            </div>
            <div class="onsched-col">

                <div class="onsched-available-times"></div>
            </div>
        </div>
        <div class="onsched-row">
            <div class="onsched-col">
            </div>
            <div class="onsched-col">
            </div>
        </div>
    </div>
            `;
        return markup;
    }

    function timesContainer(availableTimes, locationId, customerId) {

        locationId = OnSchedHelpers.IsEmpty(locationId) ? "" : locationId;
        customerId = OnSchedHelpers.IsEmpty(customerId) ? "" : customerId;

        const timesHtml = `
            <div class="time-container">
                ${availableTimes.map((availableTime, index) =>
                `<a href="#" class="time onsched-chip hoverable"
                    data-locationId="${locationId}"
                    data-customerId="${customerId}"
                    data-startDateTime="${availableTime.startDateTime}"
                    data-endDateTime="${availableTime.endDateTime}"
                    data-resourceId="${availableTime.resourceId}"
                    data-date="${availableTime.date}"
                    data-time="${availableTime.time}"
                    data-duration="${availableTime.duration}"
                    data-slots="${availableTime.availableBookings}"
                    title="Click to book now. ${availableTime.availableBookings} remaining"
                    >
                    ${timeFromDisplayTime(availableTime.displayTime)} <span class="ampm">${ampmFromDisplayTime(availableTime.displayTime)}</span>
                 </a>`
            ).join("")}
            </div>
        `;
        return timesHtml;
    }

    function weeklyDateSelector(date) {
        var options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

        // Here I need the logic to build out the weekdays
        // First from the date passed in figure out the day of the week
        var selectedDate = new Date(date);
        var workingDate = new Date(date);
        var dow = date.getDay();
        var weekStartDate = AddDaysToDate(workingDate, -dow);
        var week = [];
        var weekDayDate = weekStartDate;
        for (i = 0; i < 7; i++) {
            weekDayDate = AddDaysToDate(weekStartDate, i);
            week.push(weekDayDate);
        }
//        console.log(week);

        var dayOptions = { weekday: 'short' };
//        console.log(date.toLocaleDateString("en-US", dayOptions));

        const htmlWeekdaySelector = `
            <div class="onsched-weekday-selector">
                <table cellpadding="0" cellspacing="0" role="grid">
                    <tbody>
                        <tr>
                        ${week.map((date, index) =>
                            `<td aria-selected="true" data-day="${date.getDay()}" class="${DatesAreEqual(selectedDate, date) ? 'selected' : ''}">
                                <button data-day="${date.getDay()}" data-date="${date}" class="datepicker-day-button" class="waves-effect">
                                    ${week[index].toLocaleDateString("en-US", dayOptions)}</button>
                            </td>`
                        ).join("")}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        const htmlDatePicker = `
        <div class="onsched-datepicker-week">
            <div class="onsched-week-selector" role="heading" aria-live="assertive">
                <button class="week-prev" type="button" disabled="disabled" title="Previous week">
                    <span class="chevron">&#10094;</span>
                </button>
                <div class="date-selected">${date.toLocaleDateString("en-US", options)}</div>
                <button class="week-next" type="button" title="Next week">
                    <span class="chevron">&#10095;</span>
                </button>
            </div>
            ${htmlWeekdaySelector}
        </div>
        `;

        html = htmlDatePicker;

        return html;
    }

    function availableTimes2(availability, selectedDate, customerId) {

        const htmlNoAvailableTimes = `
            <div class="onsched-no-available-times">
                <p>There are no times available on this date</p>
            </div>
        `;

        if (availability.availableTimes.length == 0)
            return htmlNoAvailableTimes;

        var locationId = availability.locationId;

        // bust up times into morning, afternoon and evening
        var morning = []; // < 1200
        var afternoon = []; // 1200 to 1800
        var evening = []; // > 1800 

        for (var i = 0; i < availability.availableTimes.length; i++) {
            if (availability.availableTimes[i].time < 1200)
                morning.push(availability.availableTimes[i]);
            if (availability.availableTimes[i].time >= 1200 && availability.availableTimes[i].time < 1800)
                afternoon.push(availability.availableTimes[i]);
            if (availability.availableTimes[i].time > 1800)
                evening.push(availability.availableTimes[i]);
        }

        // Display Table of Morning, Afternoon and Evening Times
        // NOTE - any one of these could be empty
        // HOW DO I TEMPLATE THIS?
        // Conditionally generate rows for morning, afternoon, and evening

        const htmlMorningRows = `
                <tr><th>Morning</th></tr>
                <tr><td>${timesContainer(morning, availability.locationId, customerId)}</td></tr>
        `;
        const htmlAfternoonRows = `
                <tr><th>Afternoon</th></tr>
                <tr><td>${timesContainer(afternoon, availability.locationId, customerId,)}</td></tr>
        `;
        const htmlEveningRows = `
                <tr><th>Evening</th></tr>
                <tr><td>${timesContainer(evening, availability.locationId, customerId)}</td></tr>
        `;

        const html = `
            <table class="onsched-table">
                ${morning.length > 0 ? htmlMorningRows : ''}
                ${afternoon.length > 0 ? htmlAfternoonRows : ''}
                ${evening.length > 0 ? htmlEveningRows : ''}
            </table>
        `;

        return html;
    }

    function availableTimes(response) {

        const timesHtml = `
            <div class="onsched-time-container">
                ${response.availableTimes.map((availableTime, index) =>
                `<a href="#" class="time">
                    <div class="onsched-chip hoverable">
                        ${timeFromDisplayTime(availableTime.displayTime)} <span class="ampm">${ampmFromDisplayTime(availableTime.displayTime)}</span>
                    </div>
                </a>`
                ).join("")}
            </div>
        `;
        return timesHtml;
    }

    function calendarSelectorFromDate(date) {
        // For a quick render of the calendar
        // we build day availability from the date
        var availableDays = availableDaysFromDate(date);
        return calendarSelector(availableDays, date);
    }
    function calendarSelector(availableDays, date) {
        var options = { year: 'numeric', month: 'long' };

        var monthWeeks = getAvailableMonthWeeks(availableDays, date);

        const tmplCalendarHeader = `

            <div class="onsched-calendar-header">
                <div class="onsched-calendar-title" data-month="${date.getMonth()}" data-year="${date.getFullYear()}">
                    ${date.toLocaleDateString("en-US", options)}
                </div>
                <div class="onsched-progress-container">
                    <div class="onsched-progress">
                        <div class="indeterminate"></div>
                    </div>
                </div>
                <div style="display:inline-flex;margin-right:6px;">
                    <button class="month-prev" type="button" ${getDisabledMonthPrev(availableDays)} 
                        title="Previous month" style="padding: 0 8px;" data-firstDay="${availableDays[0].date}">
                        &#10094;
                    </button>
                    <div style="width:20px;"></div>
                    <button class="month-next" type="button" ${getDisabledMonthNext(availableDays)} 
                        title="Next month" style="padding: 0 8px;" data-lastDay="${availableDays[availableDays.length - 1].date}">
                        &#10095;
                    </button>
                </div>
            </div>
        `;

        const tmplCalendarWeekDayRow = `
            <div class="onsched-calendar-row onsched-weekdays">
                <div class="onsched-calendar-col dow" title="Sunday">Sun</div>
                <div class="onsched-calendar-col dow" title="Monday">Mon</div>
                <div class="onsched-calendar-col dow" title="Tuesday">Tue</div>
                <div class="onsched-calendar-col dow" title="Wednesday">Wed</div>
                <div class="onsched-calendar-col dow" title="Thursday">Thu</div>
                <div class="onsched-calendar-col dow" title="Friday">Fri</div>
                <div class="onsched-calendar-col dow" title="Saturday">Sat</div>
            </div>
        `;

        const tmplCalendarWeekRow = days => `
        <div class="onsched-calendar-row">
        ${days.map(day => `
            <div class="onsched-calendar-col">
                <button class="day ${IsSelected(day, date)}" data-date="${day.date}" ${IsAvailable(day)} title="${day.reason}">${ParseDate(day.date).getDate()}</button>
            </div>
        `).join('')}
        </div>
        `;
        const tmplCalendarGrid = weeks => `
        <div class="onsched-calendar-grid">
        ${tmplCalendarWeekDayRow}
            <div class="onsched-calendar-rowgroup">
            ${weeks.map(week => `
                ${tmplCalendarWeekRow(week)}
            `).join('')}        
            </div>
        </div>
        `;

        const tmplCalendar = `
            ${tmplCalendarHeader}
            ${tmplCalendarGrid(monthWeeks)}
        `;

        return tmplCalendar;
    }

    function locationsList(response) {
        const tmplLocations = `
            <div class="onsched-container">
                <div class="onsched-row">
                    <div class="onsched-col">
                        <div class="onsched-list">
                            <div class="onsched-table">
                                ${response.data.map((location, index) =>
                                `<div class="row">
                                        <div class="icon-col">
                                            <div class="onsched-circle-icon">${getLettersForIcon(location.name)}</div>
                                        </div>
                                        <div class="info-col">
                                            <a href="#" class="list-item name" data-id=${location.id} data-element="locations" 
                                                title="Click to book at this location">${location.name}
                                            </a>
                                            <div class="list-item-description">${location.address.addressLine1}</div>
                                            <div class="list-item-distance">
                                                ${location.travel != null && location.travel.distance != null ?
                                                location.travel.distance : ""}
                                            </div>
                                        </div>
                                     </div>`
                            ).join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return tmplLocations;
    }

    function servicesList(response) {
        const tmplServices =  `
            <div class="onsched-container">
                <div class="onsched-row">
                    <div class="onsched-col">
                        <div class="onsched-list">
                            <div class="onsched-table">
                                ${response.data.map((service, index) =>
                                    `<div class="row">
                                        <div class="icon-col">
                                            <div class="onsched-circle-icon">${getLettersForIcon(service.name)}</div>
                                        </div>
                                        <div class="info-col">
                                            <a href="#" class="list-item name" data-id=${service.id} data-element="services" 
                                                title="Click to book this service">${service.name}
                                            </a>
                                            <div class="list-item-description">${service.description}</div>
                                        </div>
                                     </div>`  
                                ).join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return tmplServices;
    }

    function resourcesList(response) {
        const tmplResources = `
            <div class="onsched-container">
                <div class="onsched-row">
                    <div class="onsched-col">
                        <div class="onsched-list">
                            <div class="onsched-table">
                                ${response.data.map((resource, index) =>
                                `<div class="row">
                                        <div class="icon-col">
                                            <div class="onsched-circle-icon">${getLettersForIcon(resource.name)}</div>
                                        </div>
                                        <div class="info-col">
                                            <a href="#" class="list-item name" data-id=${resource.id} data-element="resources" 
                                                title="Click to book this service">
                                                ${resource.name}
                                            </a>
                                            <div class="list-item-description">${resource.description}</div>
                                        </div>
                                     </div>`
                            ).join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return tmplResources;
    }

    function searchForm(params) {
        const tmplSearchForm = `
            <div class="onsched-container">
                <div class="onsched-row">
                    <div class="onsched-col">
                        <form class="onsched-search-form" method="get">
                            <div class="onsched-search-wrapper">
                            <input name="searchText" value="${params.searchText}" size="50" type="text" placeholder="${params.placeholder}" />
                            <input type="submit" value=" " title="Click to search" />
                            </div>
                            <p>${params.message}</p>
                        <div>
                        <div class="onsched-progress-container" style=width:100%;height:8px;">
                            <div class="onsched-progress">
                                <div class="indeterminate"></div>
                            </div>
                        </div>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        return tmplSearchForm;
    }

    function confirmation(appointment) {
        var date = new Date(appointment.dateInternational);
        var options = {
            weekday: "short", year: "numeric", month: "short",
            day: "numeric"
        };  
        var formattedDate = date.toLocaleString("en-US", options);
        const tmplConfirmation = `
            <div class="onsched-container onsched-confirmation-container">
                <div class="onsched-row">
                    <div class="onsched-col">
                        <div class="onsched-booking-confirmation">
                            <h4>${appointment.businessName}</h4>
                            <p>Your appointment has been confirmed ${appointment.name}. See details below.</p>
                            <p> </p>
                            <p>${formattedDate} @ ${OnSchedHelpers.FormatTime(appointment.time)}</p>
                            <p>${appointment.serviceName} ${OnSchedHelpers.FormatDuration(appointment.duration)} - ${appointment.resourceName}</p>
                            <p>Confirmation#: ${appointment.confirmationNumber}</p>
                            <p style="font-size:smaller">You will receive an email or sms booking confirmation shortly.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return tmplConfirmation;
    }

    //
    //  TEMPLATE HELPER FUNCTIONS. MIGRATE THESE TO HELPERS
    //
    function getDisabledMonthPrev(availableDays) {
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var firstDay = availableDays[0];
        var firstDayDate = ParseDate(firstDay.date);
        if (firstDay.reasonCode == 500 || firstDayDate == today)
            return "disabled=\"disabled\"";
        else
            return "";
    }
    function getDisabledMonthNext(availableDays) {
        var lastDay = availableDays[availableDays.length - 1];
        if (lastDay.reasonCode == 501)
            return "disabled=\"disabled\"";
        else
            return "";
    }
    function getLettersForIcon(text) {
        if (text.length < 1)
            return "";
        var parts = text.split(" ");
        var firstPart = parts[0];
        var secondPart = parts.length > 1 ? parts[1] : "";
        secondPart = secondPart.length > 0 ? secondPart :
            firstPart.length > 1 ? firstPart[2] : "";
        var initials = secondPart.length > 0 ?
            firstPart[0] + secondPart[0] : firstPart[0];
        initials = initials.toUpperCase();
        return initials;
    }

    function getAvailableMonthWeeks(availableDays, date) {
        // To render the calendar html with templates we need to transform the 
        // available days into an array of weeks of the month.

        var weeksInMonth = getDisplayableWeeks(date);
        var weekStartDate = ParseDate(availableDays[0].date);
        var monthWeeks = [];
        for (var i = 0; i < weeksInMonth; i++) {
            var week = [];
            for (var j = 0; j < 7; j++) {
                week.push(availableDays[i * 7 + j]);
            }
            weekStartDate = AddDaysToDate(weekStartDate, 7);
            monthWeeks.push(week);
        }
        return monthWeeks;
    }
    function availableDaysFromDate(date) {
        // build array of availableDays using only a date
        // this can be built quickly before availability call completes

        // How many days to I need. Same as daysToPull calculation
        // Days to pull calculation now going to be all displayableDays
        var firstDate = getFirstDisplayableDate(date);
        var weeks = getDisplayableWeeks(date);
        var displayableDays = weeks * 7;
        //        var lastDate = AddDaysToDate(firstDate, displayableDays);
        // start at firstDate and iterate through until hit last date
        var workingDate = new Date(firstDate);
        var availableDays = [];
        for (var i = 0; i < displayableDays; i++) {
            var availableDay = new AvailableDay(workingDate);
            availableDays.push(availableDay);
            workingDate = AddDaysToDate(workingDate, 1);
        }
        return availableDays;
    }

    function getFirstDisplayableDate(date) {
        // first get the beginning of month
        // then go backwards to sunday
        var firstDayOfMonth = FirstDayOfMonth(date);
        var dow = firstDayOfMonth.getDay();
        var weekStartDate = AddDaysToDate(firstDayOfMonth, -dow);
        return weekStartDate;
    }
    function getDisplayableWeeks(date) {
        var firstDay = FirstDayOfMonth(date);
        var lastDay = LastDayOfMonth(date);

        var dow = firstDay.getDay();
        var displayableMonthDaysWeekOne = 7 - dow;
        var remainingDisplayableDays = lastDay.getDate() - displayableMonthDaysWeekOne;
        var remainingDisplayableWeeks = Math.floor(remainingDisplayableDays / 7) + (remainingDisplayableDays % 7 > 0 ? 1 : 0);
        var totalDisplayableWeeks = remainingDisplayableWeeks + 1;
        return totalDisplayableWeeks;
    }
    function AvailableDay(date) {
        try {
            var today = new Date();
            var dateString = date.getFullYear() + "-" + ("0" + (date.getMonth()+1)).slice(-2) + "-" + ("0"+date.getDate()).slice(-2);
            this.date = dateString;
            this.closed = date < today ? true : false;
            this.available = date < today ? false : true;
            this.reasonCode = date < today ? 100 : 0;
            this.reason = date < today ? "Date in past" : "Day is available";
        } catch (e) {
            logException("AvailableDay", e);
        }
    }
    function IsToday(day, selectedDate) {
        const today = new Date();
        var date = ParseDate(day.date);
        var isToday =
            date.getDate() == today.getDate() &&
            date.getMonth() == today.getMonth() &&
            date.getFullYear() == today.getFullYear();
        return isToday ? "today" : "";
    }

    function IsSelected(day, selectedDate) {
        var date = ParseDate(day.date);
        var isSelected =
            date.getDate() == selectedDate.getDate() &&
            date.getMonth() == selectedDate.getMonth() &&
            date.getFullYear() == selectedDate.getFullYear();
        return isSelected ? "selected" : "";
    }
    function IsAvailable(day) {
        if (day.available)
            return "";
        else
            return "disabled=disabled";
    }
    function ParseDate(dateString) {
        var utcDate = new Date(Date.parse(dateString));
        var date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        return date;
    }
    function FirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    function LastDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
    function AddDaysToDate(inputDate, days) {
        var date = new Date(inputDate);
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        return date;
    }

    function DatesAreEqual(date1, date2) {
        var equal = false;
        if (date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate())
            equal = true;

        return equal;
    }

    function timeFromDisplayTime(displayTime) {
        var spaceIndex = displayTime.indexOf(" ");
        var time = displayTime.substr(0, spaceIndex);
        return time;
    }
    function ampmFromDisplayTime(displayTime) {
        var spaceIndex = displayTime.indexOf(" ");
        var ampm = displayTime.substr(spaceIndex + 1);
        return ampm;
    }
    return {
        availabilityContainer: availabilityContainer,
        timesContainer: timesContainer,
        availableTimes: availableTimes,
        availableTimes2: availableTimes2,
        weeklyDateSelector: weeklyDateSelector,
        calendarSelector: calendarSelector,
        calendarSelectorFromDate: calendarSelectorFromDate,
        servicesList: servicesList,
        resourcesList: resourcesList,
        locationsList: locationsList,
        searchForm: searchForm,
        confirmation: confirmation,
    };
}();



var OnSchedRest = function () {

    function HandleErrors(response) {
        if (!response.ok) {
            throw new Error(response.status);
        }
        return response;
    }
    async function Authorize(clientId, environment, scope) {
        var headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' });

        var url = environment == null || environment == "sbox" ?
            "https://onschedjsproxy-sandbox.azurewebsites.net/auth/initialize" :
            "https://onschedjsproxy.azurewebsites.net/auth/initialize";

        scope = scope == null ? "OnSchedApi" : scope;

        var payload = { "clientId": clientId, "scope": scope };
        var request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'cors',
            headers: headers
        });
        const response = await fetch(request);
        const json = await response.json();
        return json.access_token;
    }

    async function GetAccessToken(environment) {
        try {
            var url = environment == null || environment == "sbox" ?
                "https://sandbox-identity.onsched.com/connect/token" :
                "https://identity.onsched.com/connect/token";
            var clientId = "DemoUser";
            var clientSecret = "DemoUser";

            var postData = "client_id=" + clientId;
            postData += "&";
            postData += "client_secret=" + clientSecret;
            postData += "&";
            postData += "grant_type=client_credentials";
            postData += "&";
            postData += "scope=OnSchedApi";

            var request = new Request(url, {
                method: 'POST',
                body: postData,
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
            });

            const response = await fetch(request);
            const json = await response.json();
            return json.access_token;
        } catch (e) {
            console.log(e);
        }
    }

    function Get(token, url, callback) {
        try {
            var headers = token == null ?
                new Headers({ 'Accept': 'application/json' }) :
                new Headers({ 'Accept': 'application/json', 'Authorization': 'Bearer ' + token });

            var request = new Request(url, {
                method: 'GET',
                mode: 'cors',
                headers: headers
            });

            fetch(request)
                .then(HandleErrors)
                // Transform the data into json
                .then(resp => resp.json()) 
                .then(function (response) {
                    callback(response);
                    HideProgress();
                }).catch(function (error) {
//                    console.log(error.name + " " + error.message);
                    callback({ error: true, code: error.message });
                    HideProgress();
                });
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    async function PostValidateJwt(url, payload) {

        var headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' });

        var request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'cors',
            headers: headers
        });

        const response = await fetch(request);
        const json = await response.json();

        return json;
    }

    function Post(token, url, payload, callback) {

        var headers = token == null ?
            new Headers({ 'Content-Type': 'application/json','Accept': 'application/json' }) :
            new Headers({ 'Content-Type': 'application/json','Accept': 'application/json', 'Authorization': 'Bearer ' + token });

        var request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'cors',
            headers: headers
        });
        fetch(request)
            .then((resp) => resp.json()) // Transform the data into json
            .then(function (response) {
                callback(response);
                HideProgress();
            }).catch(function (error) {
                console.log(error);
            });
    }

    function Put(token, url, payload, callback) {

        var headers = token == null ?
            new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }) :
            new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Bearer ' + token });

        var request = new Request(url, {
            method: 'PUT',
            body: JSON.stringify(payload),
            mode: 'cors',
            headers: headers
        });
        fetch(request)
            .then((resp) => resp.json()) // Transform the data into json
            .then(function (response) {
                callback(response);
                HideProgress();
            }).catch(function (error) {
                console.log(error);
            });
    }

    function PostAppointment(token, url, payload, callback) {
        return Post(token, url, payload, callback);
    }

    function PostCustomer(token, url, payload, callback) {
        return Post(token, url, payload, callback);
    }

    function PutAppointmentBook(token, url, payload, callback) {

        return Put(token, url, payload, callback);

    }
    function GetAvailability(token, url, callback) {
        return Get(token, url, callback);
    }

    function GetLocations(token, url, callback) {
        return Get(token, url, callback);
    }

    function GetServiceGroups(token, url, callback) {
        return Get(token, url, callback);
    }

    function GetServices(token, url, callback) {
        return Get(token, url, callback);
    }
    function GetCustomers(token, url, callback) {
        return Get(token, url, callback);
    }
    function GetResources(token, url, callback) {
        return Get(token, url, callback);
    }

    function ShowProgress() {
        var indicators = document.getElementsByClassName("onsched-progress");
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].style.display = "block";
        }
    }
    function HideProgress() {
        var indicators = document.getElementsByClassName("onsched-progress");
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].style.display = "none";
        }
    }
    return {
        Authorize: Authorize,
        GetAccessToken: GetAccessToken,
        Get: Get,
        PostValidateJwt: PostValidateJwt,
        Post: Post,
        Put: Put,
        GetAvailability: GetAvailability,
        PostAppointment: PostAppointment,
        PostCustomer: PostCustomer,
        PutAppointmentBook: PutAppointmentBook,
        GetLocations: GetLocations,
        GetServiceGroups: GetServiceGroups,
        GetServices: GetServices,
        GetResources: GetResources,
        GetCustomers: GetCustomers,
        ShowProgress: ShowProgress,
        HideProgress: HideProgress
    };

}();




var masking = {

    // User defined Values
    //maskedInputs : document.getElementsByClassName('masked'), // add with IE 8's death
    maskedInputs: document.querySelectorAll('.masked'), // kill with IE 8's death
    maskedNumber: 'XdDmMyY9',
    maskedLetter: '_',

    init: function () {
        masking.setUpMasks(masking.maskedInputs);
        masking.maskedInputs = document.querySelectorAll('.masked'); // Repopulating. Needed b/c static node list was created above.
        masking.activateMasking(masking.maskedInputs);
    },

    setUpMasks: function (inputs) {
        var i, l = inputs.length;

        for (i = 0; i < l; i++) {
            masking.createShell(inputs[i]);
        }
    },

    // replaces each masked input with a shall containing the input and it's mask.
    createShell: function (input) {
        var text = '',
            placeholder = input.getAttribute('placeholder');

        input.setAttribute('maxlength', placeholder.length);
        input.setAttribute('data-placeholder', placeholder);
        input.removeAttribute('placeholder');

        text = '<span class="shell">' +
            '<span aria-hidden="true" id="' + input.id +
            'Mask"><i></i>' + placeholder + '</span>' +
            input.outerHTML +
            '</span>';

        input.outerHTML = text;
    },

    setValueOfMask: function (e) {
        var value = e.target.value,
            placeholder = e.target.getAttribute('data-placeholder');

        return "<i>" + value + "</i>" + placeholder.substr(value.length);
    },

    // add event listeners
    activateMasking: function (inputs) {
        var i, l;

        for (i = 0, l = inputs.length; i < l; i++) {
            if (masking.maskedInputs[i].addEventListener) { // remove "if" after death of IE 8
                masking.maskedInputs[i].addEventListener('keyup', function (e) {
                    masking.handleValueChange(e);
                }, false);
            } else if (masking.maskedInputs[i].attachEvent) { // For IE 8
                masking.maskedInputs[i].attachEvent("onkeyup", function (e) {
                    e.target = e.srcElement;
                    masking.handleValueChange(e);
                });
            }
        }
    },

    handleValueChange: function (e) {
        var id = e.target.getAttribute('id');

        switch (e.keyCode) { // allows navigating thru input
            case 20: // caplocks
            case 17: // control
            case 18: // option
            case 16: // shift
            case 37: // arrow keys
            case 38:
            case 39:
            case 40:
            case 9: // tab (let blur handle tab)
                return;
        }

        document.getElementById(id).value = masking.handleCurrentValue(e);
        document.getElementById(id + 'Mask').innerHTML = masking.setValueOfMask(e);

    },

    handleCurrentValue: function (e) {
        var isCharsetPresent = e.target.getAttribute('data-charset'),
            placeholder = isCharsetPresent || e.target.getAttribute('data-placeholder'),
            value = e.target.value, l = placeholder.length, newValue = '',
            i, j, isInt, isLetter, strippedValue;

        // strip special characters
        strippedValue = isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");

        for (i = 0, j = 0; i < l; i++) {
            var x =
                isInt = !isNaN(parseInt(strippedValue[j]));
            isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
            matchesNumber = masking.maskedNumber.indexOf(placeholder[i]) >= 0;
            matchesLetter = masking.maskedLetter.indexOf(placeholder[i]) >= 0;

            if ((matchesNumber && isInt) || (isCharsetPresent && matchesLetter && isLetter)) {

                newValue += strippedValue[j++];

            } else if ((!isCharsetPresent && !isInt && matchesNumber) || (isCharsetPresent && ((matchesLetter && !isLetter) || (matchesNumber && !isInt)))) {
                // masking.errorOnKeyEntry(); // write your own error handling function
                return newValue;

            } else {
                newValue += placeholder[i];
            }
            // break if no characters left and the pattern is non-special character
            if (strippedValue[j] == undefined) {
                break;
            }
        }
        if (e.target.getAttribute('data-valid-example')) {
            return masking.validateProgress(e, newValue);
        }
        return newValue;
    },

    validateProgress: function (e, value) {
        var validExample = e.target.getAttribute('data-valid-example'),
            pattern = new RegExp(e.target.getAttribute('pattern')),
            placeholder = e.target.getAttribute('data-placeholder'),
            l = value.length, testValue = '';

        //convert to months
        if (l == 1 && placeholder.toUpperCase().substr(0, 2) == 'MM') {
            if (value > 1 && value < 10) {
                value = '0' + value;
            }
            return value;
        }
        // test the value, removing the last character, until what you have is a submatch
        for (i = l; i >= 0; i--) {
            testValue = value + validExample.substr(value.length);
            if (pattern.test(testValue)) {
                return value;
            } else {
                value = value.substr(0, value.length - 1);
            }
        }

        return value;
    },

    errorOnKeyEntry: function () {
        // Write your own error handling
    }
};

masking.init();
