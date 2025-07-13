!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports["forms-component"] = t())
    : (e["forms-component"] = t());
})(
  "undefined" != typeof globalThis
    ? globalThis
    : "undefined" != typeof window
    ? window
    : this,
  () =>
    (() => {
      "use strict";
      var e = {
          d: (t, n) => {
            for (var o in n)
              e.o(n, o) &&
                !e.o(t, o) &&
                Object.defineProperty(t, o, { enumerable: !0, get: n[o] });
          },
          o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
          r: (e) => {
            "undefined" != typeof Symbol &&
              Symbol.toStringTag &&
              Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
              Object.defineProperty(e, "__esModule", { value: !0 });
          },
        },
        t = {};
      e.r(t), e.d(t, { default: () => m });
      var n = "form",
        o = "input",
        a = "textarea",
        i = "select",
        s = "checkbox",
        r = "radio",
        p = "button",
        c = "label",
        l = "option";
      var d =
        (void 0 && (void 0).__assign) ||
        function () {
          return (
            (d =
              Object.assign ||
              function (e) {
                for (var t, n = 1, o = arguments.length; n < o; n++)
                  for (var a in (t = arguments[n]))
                    Object.prototype.hasOwnProperty.call(t, a) && (e[a] = t[a]);
                return e;
              }),
            d.apply(this, arguments)
          );
        };
      var u =
        (void 0 && (void 0).__assign) ||
        function () {
          return (
            (u =
              Object.assign ||
              function (e) {
                for (var t, n = 1, o = arguments.length; n < o; n++)
                  for (var a in (t = arguments[n]))
                    Object.prototype.hasOwnProperty.call(t, a) && (e[a] = t[a]);
                return e;
              }),
            u.apply(this, arguments)
          );
        };

      // Shared API functions to avoid duplication
      var apiHelpers = {
        loadExcelHeaders: function(component) {
          var uploadId = localStorage.getItem('uploadedFileId');
          
          if (!uploadId) {
            alert('Please upload an Excel or CSV file first.');
            component.set('input-type', 'none');
            component.updateTraitsForInputType();
            return;
          }
          
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'http://localhost:8080/api/excel/headers?uploadId=' + uploadId, true);
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                var response = JSON.parse(xhr.responseText);
                var headers = response.map(function(header) {
                  return { value: header, name: header };
                });
                headers.unshift({ value: "", name: "Select Header" });
                
                component.set('excel-headers', headers);
                component.updateTraitsForInputType();
              } catch (e) {
                console.error('Error parsing headers response:', e);
              }
            }
          };
          
          xhr.send();
        },
        
        loadUniqueValues: function(component, columnName) {
          var uploadId = localStorage.getItem('uploadedFileId');
          
          if (!uploadId || !columnName) return;
          
          console.log('Loading unique values for column:', columnName);
          
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'http://localhost:8080/api/excel/unique-values?uploadId=' + uploadId + '&columnName=' + encodeURIComponent(columnName), true);
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                var response = JSON.parse(xhr.responseText);
                console.log('Unique values response:', response);
                
                var uniqueValues = response.map(function(value) {
                  return { value: value, name: value };
                });
                
                component.set('unique-values', uniqueValues);
                console.log('Set unique values:', uniqueValues);
                
                // For select components, force update the traits
                if (component.get('tagName') === 'select') {
                  // Reset selected values when new unique values are loaded
                  component.set('selected-values', []);
                  
                  // Update traits to refresh the unique values selector
                  component.updateTraitsForInputType();
                } else {
                  component.updateTraitsForInputType();
                }
              } catch (e) {
                console.error('Error parsing unique values response:', e);
              }
            } else {
              console.error('Failed to load unique values:', xhr.status, xhr.responseText);
            }
          };
          
          xhr.onerror = function() {
            console.error('Network error loading unique values');
          };
          
          xhr.send();
        }
      };

      const m = function (e, t) {
        void 0 === t && (t = {});
        var m = u(
          {
            blocks: [
              "form",
              "input",
              "textarea",
              "select",
              "button",
              "label",
              "checkbox",
              "radio",
            ],
            category: { id: "forms", label: "Forms" },
            block: function () {
              return {};
            },
          },
          t
        );
        !(function (e) {
          var t = e.Components,
            d = { name: "name" },
            u = { name: "placeholder" },
            m = { type: "checkbox", name: "required" },
            h = function (e, t) {
              return { type: l, content: t, attributes: { value: e } };
            },
            v = function (t) {
              e.Commands.isActive("preview") || t.preventDefault();
            };

          // Shared function to create API-enabled traits for components that have name/value
          var createInputTypeTraitsWithValue = function(originalTraits) {
            return function() {
              var inputType = this.get('input-type');
              var baseTraits = [
                {
                  type: "select",
                  name: "input-type",
                  label: "Input Type",
                  options: [
                    { value: "none", name: "None" },
                    { value: "api", name: "API" },
                  ],
                  changeProp: true
                }
              ];
              
              if (inputType === 'api') {
                // For API type, replace name and value with dropdowns but keep other traits
                var apiTraits = originalTraits.filter(function(trait) {
                  return trait.name !== 'name' && trait.name !== 'value';
                });
                
                // Add API dropdown traits
                baseTraits.push(
                  {
                    type: "select",
                    name: "name",
                    label: "Name",
                    options: this.get('excel-headers') || [{ value: "", name: "Loading headers..." }],
                    changeProp: true
                  },
                  {
                    type: "select", 
                    name: "value",
                    label: "Value",
                    options: this.get('unique-values') || [{ value: "", name: "Select header first..." }],
                    changeProp: true
                  }
                );
                
                baseTraits = baseTraits.concat(apiTraits);
                
                // Load headers if not already loaded
                if (!this.get('excel-headers') || this.get('excel-headers').length === 0) {
                  console.log('Loading Excel headers for component');
                  apiHelpers.loadExcelHeaders(this);
                }
              } else {
                // For None type, show original traits
                baseTraits = baseTraits.concat(originalTraits);
              }
              
              this.set('traits', baseTraits);
            };
          };

          // Shared function to create API-enabled traits for components that DON'T have value
          var createInputTypeTraitsWithoutValue = function(originalTraits) {
            return function() {
              var inputType = this.get('input-type');
              var baseTraits = [
                {
                  type: "select",
                  name: "input-type",
                  label: "Input Type",
                  options: [
                    { value: "none", name: "None" },
                    { value: "api", name: "API" },
                  ],
                  changeProp: true
                }
              ];
              
              if (inputType === 'api') {
                // For API type, replace name with dropdown but keep other traits
                var apiTraits = originalTraits.filter(function(trait) {
                  return trait.name !== 'name';
                });
                
                // Add API dropdown traits
                baseTraits.push({
                  type: "select",
                  name: "name",
                  label: "Name",
                  options: this.get('excel-headers') || [{ value: "", name: "Loading headers..." }],
                  changeProp: true
                });
                
                baseTraits = baseTraits.concat(apiTraits);
                
                // Load headers if not already loaded
                if (!this.get('excel-headers') || this.get('excel-headers').length === 0) {
                  console.log('Loading Excel headers for component');
                  apiHelpers.loadExcelHeaders(this);
                }
              } else {
                // For None type, show original traits
                baseTraits = baseTraits.concat(originalTraits);
              }
              
              this.set('traits', baseTraits);
            };
          };

          // Shared function for API components initialization with value
          var initApiComponentWithValue = function() {
            this.on('change:input-type', this.updateTraitsForInputType);
            
            // Listen for name changes to load unique values AND update HTML name attribute
            this.on('change:name', function() {
              var inputType = this.get('input-type');
              var selectedName = this.get('name');
              
              console.log('Name changed:', selectedName, 'Input type:', inputType);
              
              if (inputType === 'api' && selectedName) {
                // Update HTML name attribute
                this.addAttributes({ name: selectedName });
                console.log('Updated HTML name attribute to:', selectedName);
                
                // Load unique values for this header
                apiHelpers.loadUniqueValues(this, selectedName);
              }
            });
            
            // Listen for value changes to update HTML value attribute
            this.on('change:value', function() {
              var inputType = this.get('input-type');
              var selectedValue = this.get('value');
              
              console.log('Value changed:', selectedValue, 'Input type:', inputType);
              
              if (inputType === 'api' && selectedValue) {
                // Update HTML value attribute
                this.addAttributes({ value: selectedValue });
                console.log('Updated HTML value attribute to:', selectedValue);
              }
            });
            
            this.updateTraitsForInputType();
          };

          // Shared function for API components initialization without value
          var initApiComponentWithoutValue = function() {
            this.on('change:input-type', this.updateTraitsForInputType);
            
            // Listen for name changes to update HTML name attribute
            this.on('change:name', function() {
              var inputType = this.get('input-type');
              var selectedName = this.get('name');
              
              console.log('Name changed:', selectedName, 'Input type:', inputType);
              
              if (inputType === 'api' && selectedName) {
                // Update HTML name attribute
                this.addAttributes({ name: selectedName });
                console.log('Updated HTML name attribute to:', selectedName);
              }
            });
            
            this.updateTraitsForInputType();
          };

          t.addType(n, {
            isComponent: function (e) {
              return "FORM" == e.tagName;
            },
            model: {
              defaults: {
                tagName: "form",
                droppable: ":not(form)",
                draggable: ":not(form)",
                attributes: { method: "get" },
                'action-type': 'none',
                traits: [
                  {
                    type: "select",
                    name: "method",
                    options: [
                      { value: "get", name: "GET" },
                      { value: "post", name: "POST" },
                    ],
                  },
                  { name: "action" },
                ],
              },
              init: function() {
                this.on('change:attributes:method', this.updateTraits);
                this.on('change:action-type', this.updateActionAttribute);
                this.updateTraits();
              },
              updateTraits: function() {
                var method = this.get('attributes').method;
                var actionType = this.get('action-type');
                var baseTraits = [
                  {
                    type: "select",
                    name: "method",
                    options: [
                      { value: "get", name: "GET" },
                      { value: "post", name: "POST" },
                    ],
                  }
                ];
                
                if (method === 'post') {
                  baseTraits.push({
                    type: "select",
                    name: "action-type",
                    label: "Action Type",
                    options: [
                      { value: "none", name: "None" },
                      { value: "api", name: "API Call" },
                    ],
                    changeProp: true
                  });
                  
                  if (actionType !== 'api') {
                    baseTraits.push({ name: "action" });
                  }
                } else {
                  baseTraits.push({ name: "action" });
                  this.set('action-type', 'none');
                }
                
                this.set('traits', baseTraits);
              },
              updateActionAttribute: function() {
                var actionType = this.get('action-type');
                var method = this.get('attributes').method;
                
                if (method === 'post' && actionType === 'api') {
                  var Id = localStorage.getItem('uploadedFileId');
                  if (!Id) {
                    alert('Please upload an Excel or CSV file first.');
                    return;
                  }
                  
                  var apiAction = 'http://localhost:8080/api/excel/query-full-row-form/' + Id; 
                  this.addAttributes({ action: apiAction });
                } else if (actionType === 'none') {
                  var currentAction = this.get('attributes').action || '';
                  if (currentAction.includes('localhost:8080/api/excel')) {
                    this.addAttributes({ action: '' });
                  }
                }
              }
            },
            view: {
              events: {
                submit: function (e) {
                  e.preventDefault();
                  if (!this.em || this.em.get('Commands').isActive('preview')) {
                    this.handleFormSubmit(e);
                  }
                },
              },
              handleFormSubmit: function(e) {
                var form = e.target;
                var action = form.getAttribute('action');
                var method = form.getAttribute('method') || 'GET';
                var formData = new FormData(form);
                
                var data = {};
                formData.forEach(function(value, key) {
                  data[key] = value;
                });
                
                if (action) {
                  var xhr = new XMLHttpRequest();
                  xhr.open(method.toUpperCase(), action, true);
                  
                  xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                      console.log('Form submitted successfully:', xhr.responseText);
                      form.dispatchEvent(new CustomEvent('formSubmitSuccess', {
                        detail: { response: xhr.responseText }
                      }));
                    } else {
                      console.error('Form submission failed:', xhr.status);
                      form.dispatchEvent(new CustomEvent('formSubmitError', {
                        detail: { status: xhr.status, response: xhr.responseText }
                      }));
                    }
                  };
                  
                  xhr.onerror = function() {
                    console.error('Network error during form submission');
                  };
                  
                  if (method.toUpperCase() === 'POST') {
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.send(new URLSearchParams(data).toString());
                  } else {
                    xhr.send();
                  }
                }
              }
            },
          }),
            t.addType(o, {
              isComponent: function (e) {
                return "INPUT" == e.tagName;
              },
              model: {
                defaults: {
                  tagName: "input",
                  droppable: !1,
                  highlightable: !1,
                  attributes: { type: "text" },
                  'input-type': 'none',
                  'excel-headers': [],
                  'unique-values': [],
                  traits: [
                    {
                      type: "select",
                      name: "input-type",
                      label: "Input Type",
                      options: [
                        { value: "none", name: "None" },
                        { value: "api", name: "API" },
                      ],
                      changeProp: true
                    },
                    d,
                    u,
                    {
                      type: "select",
                      name: "type",
                      options: [
                        { value: "text" },
                        { value: "email" },
                        { value: "password" },
                        { value: "number" },
                      ],
                    },
                    m,
                  ],
                },
                init: initApiComponentWithoutValue,
                updateTraitsForInputType: createInputTypeTraitsWithoutValue([d, u, {
                  type: "select",
                  name: "type",
                  options: [
                    { value: "text" },
                    { value: "email" },
                    { value: "password" },
                    { value: "number" },
                  ],
                }, m])
              },
              extendFnView: ["updateAttributes"],
              view: {
                updateAttributes: function () {
                  this.el.setAttribute("autocomplete", "off");
                },
              },
            }),
            t.addType(a, {
              extend: o,
              isComponent: function (e) {
                return "TEXTAREA" == e.tagName;
              },
              model: {
                defaults: {
                  tagName: "textarea",
                  attributes: {},
                  'input-type': 'none',
                  'excel-headers': [],
                  'unique-values': [],
                  traits: [
                    {
                      type: "select",
                      name: "input-type",
                      label: "Input Type",
                      options: [
                        { value: "none", name: "None" },
                        { value: "api", name: "API" },
                      ],
                      changeProp: true
                    },
                    d, 
                    u, 
                    m
                  ],
                },
                init: initApiComponentWithoutValue,
                updateTraitsForInputType: createInputTypeTraitsWithoutValue([d, u, m])
              },
            }),
            t.addType(l, {
              isComponent: function (e) {
                return "OPTION" == e.tagName;
              },
              model: {
                defaults: {
                  tagName: "option",
                  layerable: !1,
                  droppable: !1,
                  draggable: !1,
                  highlightable: !1,
                },
              },
            }),
            t.addType(i, {
              extend: o,
              isComponent: function (e) {
                return "SELECT" == e.tagName;
              },
              model: {
                defaults: {
                  tagName: "select",
                  components: [h("opt1", "Option 1"), h("opt2", "Option 2")],
                  'input-type': 'none',
                  'excel-headers': [],
                  'unique-values': [],
                  'selected-values': [],
                  traits: [
                    {
                      type: "select",
                      name: "input-type",
                      label: "Input Type",
                      options: [
                        { value: "none", name: "None" },
                        { value: "api", name: "API" },
                      ],
                      changeProp: true
                    },
                    d, 
                    { name: "options", type: "select-options" }, 
                    m
                  ],
                },
                init: function() {
                  this.on('change:input-type', this.updateTraitsForInputType);
                  
                  // Listen for name changes to load unique values
                  this.on('change:name', function() {
                    var inputType = this.get('input-type');
                    var selectedName = this.get('name');
                    
                    console.log('Select name changed:', selectedName, 'Input type:', inputType);
                    
                    if (inputType === 'api' && selectedName) {
                      // Update HTML name attribute
                      this.addAttributes({ name: selectedName });
                      console.log('Updated HTML name attribute to:', selectedName);
                      
                      // Reset selected values when header changes
                      this.set('selected-values', []);
                      
                      // Load unique values for this header
                      apiHelpers.loadUniqueValues(this, selectedName);
                    }
                  });
                  
                  // Listen for unique values changes to trigger trait re-render
                  this.on('change:unique-values', function() {
                    console.log('Unique values changed, triggering trait update');
                    var inputType = this.get('input-type');
                    if (inputType === 'api') {
                      // Force refresh traits to update the unique-values-selector
                      this.updateTraitsForInputType();
                      
                      // Also trigger the trait manager to re-render
                      setTimeout(function() {
                        if (this.em && this.em.get('TraitManager')) {
                          var traitManager = this.em.get('TraitManager');
                          if (traitManager.getTraitsViewer) {
                            var viewer = traitManager.getTraitsViewer();
                            if (viewer && viewer.render) {
                              viewer.render();
                            }
                          }
                        }
                      }.bind(this), 50);
                    }
                  });
                  
                  // Listen for selected values changes to update HTML options
                  this.on('change:selected-values', function() {
                    var inputType = this.get('input-type');
                    
                    if (inputType === 'api') {
                      this.updateSelectOptions();
                    }
                  });
                  
                  this.updateTraitsForInputType();
                },
                updateTraitsForInputType: function() {
                  var inputType = this.get('input-type');
                  var baseTraits = [
                    {
                      type: "select",
                      name: "input-type",
                      label: "Input Type",
                      options: [
                        { value: "none", name: "None" },
                        { value: "api", name: "API" },
                      ],
                      changeProp: true
                    }
                  ];
                  
                  if (inputType === 'api') {
                    // For API type, show name dropdown and unique values selector
                    baseTraits.push(
                      {
                        type: "select",
                        name: "name",
                        label: "Name",
                        options: this.get('excel-headers') || [{ value: "", name: "Loading headers..." }],
                        changeProp: true
                      },
                      {
                        type: "unique-values-selector",
                        name: "selected-values",
                        label: "Options",
                        uniqueValues: this.get('unique-values') || [],
                        changeProp: true
                      },
                      m
                    );
                    
                    // Load headers if not already loaded
                    if (!this.get('excel-headers') || this.get('excel-headers').length === 0) {
                      console.log('Loading Excel headers for select component');
                      apiHelpers.loadExcelHeaders(this);
                    }
                  } else {
                    // For None type, show original traits
                    baseTraits.push(
                      d, 
                      { name: "options", type: "select-options" }, 
                      m
                    );
                  }
                  
                  this.set('traits', baseTraits);
                  
                  // Force refresh the trait manager if it exists
                  if (this.em && this.em.get('TraitManager')) {
                    var traitManager = this.em.get('TraitManager');
                    if (traitManager.getTraitsViewer) {
                      var viewer = traitManager.getTraitsViewer();
                      if (viewer && viewer.updatedCollection) {
                        viewer.updatedCollection();
                      }
                    }
                  }
                },
                updateSelectOptions: function() {
                  var selectedValues = this.get('selected-values') || [];
                  var newOptions = [];
                  
                  // Create option components for each selected value
                  for (var i = 0; i < selectedValues.length; i++) {
                    var value = selectedValues[i];
                    newOptions.push({
                      type: l,
                      content: value,
                      attributes: { value: value }
                    });
                  }
                  
                  // Update the select component's children
                  this.components().reset(newOptions);
                  this.view && this.view.render();
                }
              },
              view: { events: { mousedown: v } },
            }),
            t.addType(s, {
              extend: o,
              isComponent: function (e) {
                return "INPUT" == e.tagName && "checkbox" == e.type;
              },
              model: {
                defaults: {
                  copyable: !1,
                  attributes: { type: "checkbox" },
                  'input-type': 'none',
                  'excel-headers': [],
                  'unique-values': [],
                  traits: [
                    {
                      type: "select",
                      name: "input-type",
                      label: "Input Type",
                      options: [
                        { value: "none", name: "None" },
                        { value: "api", name: "API" },
                      ],
                      changeProp: true
                    },
                    { name: "id" },
                    d,
                    { name: "value" },
                    m,
                    { type: "checkbox", name: "checked" },
                  ],
                },
                init: initApiComponentWithValue,
                updateTraitsForInputType: createInputTypeTraitsWithValue([{ name: "id" }, d, { name: "value" }, m, { type: "checkbox", name: "checked" }])
              },
              view: {
                events: { click: v },
                init: function () {
                  this.listenTo(
                    this.model,
                    "change:attributes:checked",
                    this.handleChecked
                  );
                },
                handleChecked: function () {
                  var e;
                  this.el.checked = !!(null ===
                    (e = this.model.get("attributes")) || void 0 === e
                    ? void 0
                    : e.checked);
                },
              },
            }),
            t.addType(r, {
              extend: s,
              isComponent: function (e) {
                return "INPUT" == e.tagName && "radio" == e.type;
              },
              model: { defaults: { attributes: { type: "radio" } } },
            }),
            t.addType(p, {
              extend: o,
              isComponent: function (e) {
                return "BUTTON" == e.tagName;
              },
              model: {
                defaults: {
                  tagName: "button",
                  attributes: { type: "button" },
                  text: "Send",
                  traits: [
                    { name: "text", changeProp: !0 },
                    {
                      type: "select",
                      name: "type",
                      options: [
                        { value: "button" },
                        { value: "submit" },
                        { value: "reset" },
                      ],
                    },
                  ],
                },
                init: function () {
                  var e = this.components(),
                    t = 1 === e.length && e.models[0],
                    n = (t && t.is("textnode") && t.get("content")) || "",
                    o = n || this.get("text");
                  this.set("text", o),
                    this.on("change:text", this.__onTextChange),
                    o !== n && this.__onTextChange();
                },
                __onTextChange: function () {
                  this.components(this.get("text"));
                },
              },
              view: { events: { click: v } },
            }),
            t.addType(c, {
              extend: "text",
              isComponent: function (e) {
                return "LABEL" == e.tagName;
              },
              model: {
                defaults: {
                  tagName: "label",
                  components: "Label",
                  traits: [
                    { name: "for" }
                  ],
                },
              },
            });
        })(e),
          (function (e) {
            e.TraitManager.addType("select-options", {
              events: { keyup: "onChange" },
              onValueChange: function () {
                for (
                  var e = this.model,
                    t = this.target,
                    n = e.get("value").trim().split("\n"),
                    o = [],
                    a = 0;
                  a < n.length;
                  a++
                ) {
                  var i = n[a].split("::");
                  o.push({
                    type: l,
                    components: i[1] || i[0],
                    attributes: { value: i[0] },
                  });
                }
                t.components().reset(o), t.view.render();
              },
              getInputEl: function () {
                if (!this.$input) {
                  for (
                    var e = [], t = this.target.components(), n = 0;
                    n < t.length;
                    n++
                  ) {
                    var o = t.models[n],
                      a = o.get("attributes").value || "",
                      i = o.components().models[0],
                      s = (i && i.get("content")) || "";
                    e.push("".concat(a, "::").concat(s));
                  }
                  (this.$input = document.createElement("textarea")),
                    (this.$input.value = e.join("\n"));
                }
                return this.$input;
              },
            });

            // Add custom trait type for unique values selector with checkboxes
            e.TraitManager.addType("unique-values-selector", {
              templateInput: function() {
                return '<div class="unique-values-container"></div>';
              },
              
              onRender: function() {
                console.log('Trait onRender called');
                this.updateContent();
                
                // Listen for changes to unique-values on the target
                this.listenTo(this.target, 'change:unique-values', function() {
                  console.log('Target unique-values changed, updating content');
                  this.updateContent();
                });
              },
              
              updateContent: function() {
                var target = this.target;
                var uniqueValues = target.get('unique-values') || [];
                var selectedValues = target.get('selected-values') || [];
                var container = this.el.querySelector('.unique-values-container');
                
                console.log('updateContent called with unique values:', uniqueValues);
                
                if (!container) {
                  console.log('Container not found');
                  return;
                }
                
                // Clear existing content
                container.innerHTML = '';
                container.style.cssText = 'max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; width: 72.5%; ';
                
                if (uniqueValues.length === 0) {
                  container.innerHTML = '<div style="padding: 10px;">Select a header first...</div>';
                  return;
                }
                
                console.log('Rendering', uniqueValues.length, 'unique values');
                
                var trait = this;
                
                // Create checkboxes for each unique value
                uniqueValues.forEach(function(valueObj, index) {
                  if (!valueObj.value) return; // Skip empty values
                  
                  var checkboxContainer = document.createElement('div');
                  checkboxContainer.style.cssText = 'display: flex; align-items: center; padding: 3px 0; justify-content: space-between;';
                  
                  var leftDiv = document.createElement('div');
                  leftDiv.style.cssText = 'display: flex; align-items: center;';
                  
                  var checkbox = document.createElement('input');
                  checkbox.type = 'checkbox';
                  checkbox.value = valueObj.value;
                  checkbox.id = 'checkbox_' + index;
                  checkbox.style.cssText = 'margin-right: 5px;';
                  
                  // Check if this value is already selected
                  checkbox.checked = selectedValues.indexOf(valueObj.value) !== -1;
                  
                  var label = document.createElement('label');
                  label.htmlFor = checkbox.id;
                  label.textContent = valueObj.name || valueObj.value;
                  label.style.cssText = 'cursor: pointer; font-size: 12px;';
                  
                  leftDiv.appendChild(checkbox);
                  leftDiv.appendChild(label);
                  
                  // Add number indicator
                  var numberSpan = document.createElement('span');
                  numberSpan.style.cssText = 'background: #007cba;  border-radius: 10px; padding: 2px 6px; font-size: 10px; min-width: 16px; text-align: center;';
                  var currentIndex = selectedValues.indexOf(valueObj.value);
                  numberSpan.textContent = currentIndex !== -1 ? (currentIndex + 1) : '';
                  numberSpan.id = 'number_' + index;
                  
                  checkboxContainer.appendChild(leftDiv);
                  checkboxContainer.appendChild(numberSpan);
                  
                  // Add change event listener
                  checkbox.addEventListener('change', function() {
                    var currentSelected = target.get('selected-values') || [];
                    var newSelected = [];
                    
                    if (this.checked) {
                      // Add to selected values
                      newSelected = currentSelected.concat([this.value]);
                    } else {
                      // Remove from selected values
                      newSelected = currentSelected.filter(function(val) {
                        return val !== checkbox.value;
                      });
                    }
                    
                    console.log('Updating selected values:', newSelected);
                    target.set('selected-values', newSelected);
                    
                    // Update all number indicators
                    trait.updateNumberIndicators(container, newSelected);
                  });
                  
                  container.appendChild(checkboxContainer);
                });
              },
              
              updateNumberIndicators: function(container, selectedValues) {
                var checkboxes = container.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(function(checkbox, index) {
                  var numberSpan = container.querySelector('#number_' + index);
                  if (numberSpan) {
                    var valueIndex = selectedValues.indexOf(checkbox.value);
                    numberSpan.textContent = valueIndex !== -1 ? (valueIndex + 1) : '';
                  }
                });
              },
              
              onValueChange: function() {
                // This gets called when the target's selected-values change
                console.log('onValueChange called');
                this.updateContent();
              }
            });
          })(e),
          (function (e, t) {
            var l = t,
              u = e.BlockManager,
              m = function (e, n) {
                var o;
                (null === (o = l.blocks) || void 0 === o
                  ? void 0
                  : o.indexOf(e)) >= 0 &&
                  u.add(
                    e,
                    d(
                      d(d({}, n), { category: l.category, select: !0 }),
                      t.block(e)
                    )
                  );
              };
            m(n, {
              label: "Form",
              media:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 5.5c0-.3-.5-.5-1.3-.5H3.4c-.8 0-1.3.2-1.3.5v3c0 .3.5.5 1.3.5h17.4c.8 0 1.3-.2 1.3-.5v-3zM21 8H3V6h18v2zM22 10.5c0-.3-.5-.5-1.3-.5H3.4c-.8 0-1.3.2-1.3.5v3c0 .3.5.5 1.3.5h17.4c.8 0 1.3-.2 1.3-.5v-3zM21 13H3v-2h18v2z"/><rect width="10" height="3" x="2" y="15" rx=".5"/></svg>',
              content: {
                type: n,
                components: [
                  {
                    components: [{ type: c, components: "Name" }, { type: o }],
                  },
                  {
                    components: [
                      { type: c, components: "Email" },
                      { type: o, attributes: { type: "email" } },
                    ],
                  },
                  {
                    components: [
                      { type: c, components: "Gender" },
                      { type: s, attributes: { value: "M" } },
                      { type: c, components: "M" },
                      { type: s, attributes: { value: "F" } },
                      { type: c, components: "F" },
                    ],
                  },
                  {
                    components: [
                      { type: c, components: "Message" },
                      { type: a },
                    ],
                  },
                  { components: [{ type: p }] },
                ],
              },
            }),
              m(o, {
                label: "Input",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M4 10h1v4H4z"/></svg>',
                content: { type: o },
              }),
              m(a, {
                label: "Textarea",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 7.5c0-.9-.5-1.5-1.3-1.5H3.4C2.5 6 2 6.6 2 7.5v9c0 .9.5 1.5 1.3 1.5h17.4c.8 0 1.3-.6 1.3-1.5v-9zM21 17H3V7h18v10z"/><path d="M4 8h1v4H4zM19 7h1v10h-1zM20 8h1v1h-1zM20 15h1v1h-1z"/></svg>',
                content: { type: a },
              }),
              m(i, {
                label: "Select",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M18.5 13l1.5-2h-3zM4 11.5h11v1H4z"/></svg>',
                content: { type: i },
              }),
              m(p, {
                label: "Button",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M4 11.5h16v1H4z"/></svg>',
                content: { type: p },
              }),
              m(c, {
                label: "Label",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 11.9c0-.6-.5-.9-1.3-.9H3.4c-.8 0-1.3.3-1.3.9V17c0 .5.5.9 1.3.9h17.4c.8 0 1.3-.4 1.3-.9V12zM21 17H3v-5h18v5z"/><rect width="14" height="5" x="2" y="5" rx=".5"/><path d="M4 13h1v3H4z"/></svg>',
                content: { type: c },
              }),
              m(s, {
                label: "Checkbox",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 17l-5-5 1.41-1.42L10 14.17l7.59-7.59L19 8m0-5H5c-1.11 0-2 .89-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5a2 2 0 0 0-2-2z"></path></svg>',
                content: { type: s },
              }),
              m(r, {
                label: "Radio",
                media:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-18C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"></path></svg>',
                content: { type: r },
              });
          })(e, m);
      };
      return t;
    })()
  );