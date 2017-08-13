/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
$(document).ready(function() {

    $(".navbar-left a").on("click", function(){
        $(".navbar-right").find(".active").removeClass("active");
        //$(this).parent().addClass("active");
    });
    
    $(".dropdown-menu a").on("click", function(){
        $(".navbar-left").find(".active").removeClass("active");
        //$(this).parent().addClass("active");
    });

});

var app = {
    nombreApp: 'ODK Collect',
    extApp: 'org.odk.collect.android',
    config:[],
    tieneODK: null,
    esSD: null,
    forms:[],
    instances:[],
    dbInstancias:null,
    ambiente: 'desarrollo',
    //ambiente: 'produccion',
    
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('resume', this.onResume, false);
        //window.addEventListener('load', this.onDeviceReady, false);
        
        document.getElementById('abrir_hogar').addEventListener('click', this.abrirHogar, false);
        

        document.getElementById('abrir_madre').addEventListener('click', this.abrirMadre, false);
        document.getElementById('abrir_ninio').addEventListener('click', this.abrirNinio, false);;
        
        
        document.getElementById('abrir_envios').addEventListener('click', this.abrirEnvios, false);
        
        document.getElementById('ejecutar_respaldo').addEventListener('click', this.ejecutarRespaldo, false);
        document.getElementById('guardar_config').addEventListener('click', this.guardarConfig, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        _log('onDeviceReady');
        FastClick.attach(document.body);
        app.receivedEvent();
        
        

        //app.crearBotones();
    },
    
    onResume: function(){
        /*
        app.analizarFileSystem(function(){
            app.cargarFormulariosConInstancias(function(){
                app.desplegarListas();
            });
        }); 
        */
        
        //app.analizarFileSystem(function(){
        //}); 
        app.cargarFormulariosConInstanciasUsandoContentProvider(function(){
            app.desplegarListasUsandoContentProvider();
        });
    },
    
    receivedEvent: function() {
        setTimeout(function(){
            moment.locale('es');
            
            
            /*
            app.cargarConfig(function(){
                app.analizarFileSystem(function(){
                    app.cargarFormulariosConInstancias(function(){
                        app.desplegarListas();
                    });
                }); 
                //app.cargarBddInstancias();
            });
            */
            
            app.cargarConfig(function(){
                app.analizarFileSystem(function(){
                }); 
                app.cargarFormulariosConInstanciasUsandoContentProvider(function(){
                    app.desplegarListasUsandoContentProvider();
                });
                //app.cargarBddInstancias();
            });
            
            
            var sApp = window.startApp.set({
                "action":"ACTION_MAIN",
                "category":"CATEGORY_LAUNCHER",
                //"type":"text/css",
                "package":app.extApp,
                //"uri":"file://data/index.html",
                //"flags":["FLAG_ACTIVITY_CLEAR_TOP","FLAG_ACTIVITY_CLEAR_TASK"],
                //"component": ["com.app.name","com.app.name.Activity"],
                //"intentstart":"startActivity",
            }, { //// extras 
            });


            sApp.check(function(values) { /* success */
                _log('ODK values', values);
            }, function(error) { /* fail */
                $("#noHayExtApp").removeClass('hidden');
                $("#noHayExtAppMsg").text(error);
                $("#noHayExtAppNombre").text(app.nombreApp);

            });

            
        }, 500);

    },
    
    

    abrirEnvios: function(){
        app.ejecutarRespaldo();
        
        var sApp = startApp.set({ 
            "action":'ACTION_VIEW', //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_EDIT", //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_PICK", //FormChooserList

            "category":"CATEGORY_DEFAULT",

            //"type":"vnd.android.cursor.dir/vnd.odk.form", // FormChooserList
            //"type":"vnd.android.cursor.dir/vnd.odk.instance", //InstanceChooserList
            //"type":"vnd.android.cursor.item/vnd.odk.form", //FormEntryActivity

            "package":'org.odk.collect.android',  

            "uri": 'content://org.odk.collect.android.provider.odk.instances/instances/',

            "component": [
                "org.odk.collect.android", 
                //"org.odk.collect.android.activities.FormEntryActivity"
                //"org.odk.collect.android.activities.InstanceChooserList"
                "org.odk.collect.android.activities.InstanceUploaderList"
                //"org.odk.collect.android.activities.FormChooserList"
            ],
        }, { 
        });
        
        sApp.start(function() { 
            _log('abrirEnvios', "OK");
            
        }, function(error) { 
            _error('abrirEnvios', error);
        });
    },
    
    vincularContentProvider: function(tipo, callback){
        //app.forms = [];
        //app.instances = [];
        
        window.plugins.contentproviderplugin.query({
            contentUri: "content://org.odk.collect.android.provider.odk."+tipo+"/"+tipo+"/",
            projection: null, //["address", "date", "body"],
            selection: null,
            selectionArgs: null,
            sortOrder: null, //"date DESC"
        }, function (data) {
            _log('contentproviderplugin ' + tipo, data);
            
            data.forEach(function(d){
                if (tipo == 'forms') {
                    _log(app.forms, d);
                    app.forms[d.jrFormId].contentProvider = d;
                } else { //instances
                _log(app.instances, d);
                    var fileName = d.instanceFilePath.split('/').pop();
                    app.instances[fileName].contentProvider = d;
                }

            });
            
            callback();
        }, function (error) {
            _error('vincularContentProvider', tipo, error);
        });
    },


    cargarFormulariosConInstanciasUsandoContentProvider: function(callback) {
        _log('cargarFormulariosConInstanciasUsandoContentProvider');
        
        window.plugins.contentproviderplugin.query({
            contentUri: "content://org.odk.collect.android.provider.odk.forms/forms/", 
            projection: null, 
            selection: null,
            selectionArgs: null,
            sortOrder: null, 
        }, function (forms) {
            _log('traidos los formularios desde Content Provider ', forms);
            
            app.forms = forms;
            
            app.forms.forEach(function(form, index){
                
                app.forms[index]['instances'] = [];
                
                app.forms[form.jrFormId] = app.forms[index];
                
                _log('form', form, form.jrFormId);
                
            });
            
            app.llenarOpcionesVinculacion();
            app.cargarInstanciasUsandoContentProvider(callback);
            
        }, function (error) {
            _error('No se pudo traer los formularios desde Content Provider ', error);
        });
    },
    
    cargarInstanciasUsandoContentProvider: function(callback) {
        _log('cargarInstanciasUsandoContentProvider');
        window.plugins.contentproviderplugin.query({
            contentUri: "content://org.odk.collect.android.provider.odk.instances/instances/", 
            projection: null, 
            selection: null,
            selectionArgs: null,
            sortOrder: null, 
        }, function (instances) {
            _log('traidas las instancias desde Content Provider ', instances);
            
            app.instances = instances;
            
            app.instances.forEach(function(instance, index){
                
                var fileName = instance.instanceFilePath.split('/').pop();
                
                app.forms[instance.jrFormId].instances.push(app.instances[index]);
                
                app.instances[fileName] = app.instances[index];
                
                _log('instance', instance, fileName);

            });
            
            callback();
        }, function (error) {
            _error('No se pudo traer las instancias desde Content Provider ', error);
        });
    },

    
    cargarFormulariosConInstancias: function(callback) {
        _log('cargarFormulariosConInstancias');
        
        app.instances = [];
        app.forms = [];
        
        window.resolveLocalFileSystemURL(
            app.tieneODK + 'odk/forms',
            function(fileSystem) {
                _log('FILESYSTEM: ', fileSystem);

                // create a directory reader
                var directoryReader = fileSystem.createReader();
                // Get a list of all the entries in the directory
                directoryReader.readEntries(

                    function (allEntries){
                        
                        
                        _log('allEntries', allEntries);
                        
                        var entries = [];
                        
                        //Quita del array los que no son archivos:
                        allEntries.forEach(function(entry, index, object) {
                            if (entry.isFile) {
                                //object.splice(index, 1);
                                entries.push(entry);
                            }
                        });
                        
                        
                        //entries.sort(function compare(a,b) {    
                            //return a.name.localeCompare(b.name);
                        //});
                        
                        _log('entries despues', entries);
                        
                        
                        entries.forEach(function(entry, index){
                            _log('entry index', entry, index);
    
                                
                            entry.file(function (file) {
                                var reader = new FileReader();

                                reader.onloadend = function() {

                                    _log("Formulario leido con exito: ", this);

                                    var parser = new DOMParser();
                                    var xmlDoc = parser.parseFromString(this.result, "text/xml"); //da error cuando se manda a console.log

                                    /*
                                    _log('xmlDoc del form', this,
                                        xmlDoc, 
                                        xmlDoc.getElementsByTagName("instance"), 
                                        xmlDoc.getElementsByTagName('title')
                                    );
                                    */

                                    //console.log('instance', xmlDoc.getElementsByTagName("instance"));
                                    //console.log('cero', xmlDoc.getElementsByTagName("instance")[0]);
                                    //console.log('firstElementChild', xmlDoc.getElementsByTagName("instance")[0].firstElementChild);
                                    //console.log('attributes', xmlDoc.getElementsByTagName("instance")[0].attributes[0].value);
                                    //console.log('id', xmlDoc.getElementsByTagName("instance")[0].firstElementChild.getAttribute('id'));
                                    
                                    var id = xmlDoc.getElementsByTagName("instance")[0].firstElementChild.getAttribute('id'); //id
                                    _log('id', id);
                                    
                                    
                                    
                                    //_log('title', xmlDoc.getElementsByTagName('title'));
                                    //_log('cero', [xmlDoc.getElementsByTagName('title')[0]]);
                                    //_log('firstChild', xmlDoc.getElementsByTagName('title').firstChild);
                                    //_log('data', xmlDoc.getElementsByTagName('title')[0].firstChild.data);
                                    var title = ''; 
                                    
                                    try{
                                        title = xmlDoc.getElementsByTagName('title')[0].firstChild.data;
                                    }catch(e){
                                        _error('No hay title', e);
                                    }
                                    
                                    
                                    _log('title', title);

                                    var form = {
                                        entry:entry,
                                        //xmlDoc: xmlDoc,
                                        id:id,
                                        title:title,
                                        file:file,
                                        contentProvider:null,
                                        //index: (index + 1),
                                        instances:[]
                                    };
                                    
                                    _log('pre form', form);

                                    var newLength = app.forms.push(form);
                                    
                                    _log('newLength', newLength);

                                    app.forms[id] = app.forms[newLength - 1];
                                    app.forms[title] = app.forms[newLength - 1];

                                    _log('form', form, newLength, app.forms.length , entries.length);

                                    if (app.forms.length === entries.length) {
                                        _log('app.forms', app.forms, entries.length);
                                        
                                        app.vincularContentProvider('forms', function(){
                                            app.llenarOpcionesVinculacion();
                                            app.cargarInstancias(callback);
                                        });
                                        
                                        
                                    }


                                }//.bind(entries);

                                _log('file', file);

                                reader.readAsText(file);
                            }, function(error){_error('onErrorReadFile', error)});




                        });

                    },

                    function(error){'directoryReader.readEntries', _error(error);}
                );
            },
            function(error){
                _error('window.resolveLocalFileSystemURL', error);
            }
        );        
        
    },
    
    cargarInstancias: function(callback) {
        _log('cargarInstancias', app.tieneODK + 'odk/instances');
        
        
        window.resolveLocalFileSystemURL(
            app.tieneODK + 'odk/instances',
            function(fileSystem) {
                _log('FILESYSTEM: ', fileSystem);

                var directoryReader = fileSystem.createReader();

                directoryReader.readEntries(

                    function (allDirEntries){
                        
                        
                        //Quita del array los que no son directorios:
                        var dirEntries = [];
                        var entries = [];
                        var dirEntriesCount = 0;
                        
                        allDirEntries.forEach(function(dirEntry) {
                            if (dirEntry.isDirectory) {
                                //object.splice(index, 1);
                                dirEntries.push(dirEntry);
                            }
                        });
                        
                        dirEntries.sort(function compare(a,b) {
                            return a.name.localeCompare(b.name);
                        });
                        
                        dirEntries.forEach(function(dirEntry, index){
                            
                            
                            _log('dirEntry', dirEntry);
                            
                            
                            var dirEntryReader = dirEntry.createReader();
                            // Get a list of all the entries in the directory
                            dirEntryReader.readEntries(

                                function (allEntries){
                                    
                                    //Quita del array los que no son archivos XML:
                                    
                                    allEntries.forEach(function(entry) {
                                        //if (entry.isFile && entry.fullPath.endsWith('.xml')) {
                                        if (entry.isFile && entry.fullPath.match('xml$')) {
                                            entries.push(entry);
                                        }
                                    });
                                    
                                    
                                    dirEntriesCount ++;
                                    _log('entries', entries, dirEntriesCount, dirEntries.length);
                                    
                                    if (dirEntriesCount === dirEntries.length) {

                                        entries.forEach(function(entry){
                                            _log('entry', entry);

                                            entry.file(function (file) {
                                                var reader = new FileReader();

                                                reader.onloadend = function() {

                                                    var id;
                                                    var title;

                                                    _log("Instancia leida con exito: ", this);

                                                    var parser = new DOMParser();
                                                    var xmlDoc = parser.parseFromString(this.result, "text/xml");

                                                    _log('xmlDoc de la instancia', 
                                                        xmlDoc, 
                                                        xmlDoc.getElementsByTagName("meta")
                                                    );

                                                    //var form_id = xmlDoc.getElementsByTagName("meta")[0].parentNode.id;
                                                    var form_id = xmlDoc.firstChild.id;
                                                    //var instanceID = xmlDoc.getElementsByTagName('instanceID')[0].firstChild.data;

                                                    var instance = {
                                                        entry:entry,
                                                    //    xmlDoc: xmlDoc,
                                                        form_id:form_id,
                                                        //instanceID:instanceID,
                                                        file:file,
                                                        contentProvider:null,
                                                        //index: (index + 1),
                                                        form:app.forms[form_id]

                                                    };



                                                    var newLength = app.instances.push(instance);
                                                    

                                                    app.instances[file.name] = app.instances[newLength - 1];
                                                    app.forms[form_id].instances.push(app.instances[file.name]);


                                                    _log('instance', instance, newLength, app.instances.length, entries.length);

                                                    if (app.instances.length === entries.length) {
                                                        
                                                        app.instances.sort(function(a,b){
                                                            return a.file.name.localeCompare(b.file.name);
                                                            //return a.file.lastModified - b.file.lastModified;
                                                        });
                                                        
                                                        app.instances = app.instances.map(function(i, index){
                                                            //i.index = index + 1;
                                                            return i;
                                                        });
                                                        
                                                        app.instances.forEach(function(instance, index, object){
                                                            //object[instance.instanceID] = instance;
                                                            object[instance.file.name] = instance;
                                                        });
                                                        

                                                        app.forms.sort(function(a,b){
                                                            //return a.index - b.index;
                                                            return a.file.lastModified - b.file.lastModified;
                                                        });
                                                        
                                                        app.forms = app.forms.map(function(f, index){
                                                            //f.index = index + 1;
                                                            
                                                            f.instances.sort(function(a,b){
                                                                return a.file.name.localeCompare(b.file.name);
                                                            });
                                                            return f;
                                                        });
                                                        
                                                        app.forms.forEach(function(form, index, object){
                                                            object[form.id] = form;
                                                        });
                                                        

                                                        

                                                        app.vincularContentProvider('instances', function(){
                                                            _log('app.instances', app.instances);
                                                            _log('app.forms', app.forms);
                                                            callback();
                                                        });

                                                        

                                                    }
                                                };

                                                _log('file', file, index);

                                                reader.readAsText(file);
                                            }, function(error){_error('onErrorReadFile', error)});
                                        });
                                    }
                                },
                                function(error){
                                    _error('dirEntryReader.readEntries', error);
                                }
                            );
                        });
                    },
                    function(error){_error(error);}
                );
            },
            function(error){
                _error(error);
            }
        );        
    },
    
    llenarOpcionesVinculacion: function() {
        _log('llenarOpcionesVinculacion');
        
        var buff; 
        var opcion_seleccionada;
        
        ['hogar', 'madre', 'ninio'].forEach(function(tipo){
            buff = '';
            opcion_seleccionada = -1;
            
            _log(tipo);
            _log(app.config);
            
            if (app.config[tipo] && app.forms && app.forms[app.config[tipo]]) {
                opcion_seleccionada = app.forms[app.config[tipo]].jrFormId;
            }
            
            _log('opcion_seleccionada', opcion_seleccionada);
            
            app.forms.forEach(function(form){
                var selected = (opcion_seleccionada == form.jrFormId) ? 'selected' : '';
                buff += '<option value="'+form.jrFormId+'" '+selected+'>'+form.displayName+'</option>';
            });

            document.getElementById(tipo + '_form_select').innerHTML = buff;            
        });
    },

    cargarConfig: function(callback){
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

            _log('file system open: ' + fs.name);
            fs.root.getFile("config.txt", { create: true, exclusive: false }, function (fileEntry) {


                fileEntry.file(function (file) {
                    var reader = new FileReader();

                    reader.onloadend = function() {
                        _log("Successful file read: " + this.result);
                        //document.getElementById('config_content').innerHTML = (fileEntry.fullPath + ": " + this.result);
                        app.config = this.result.split(',');
                        
                        if (app.config.length === 3) {
                            app.config['hogar'] = app.config[0];
                            app.config['madre'] = app.config[1];
                            app.config['ninio'] = app.config[2];

                            //document.getElementById('hogar_form').value = app.config[0];
                            //document.getElementById('madre_form').value = app.config[1];
                            
                        } else {
                            _log('XXX No hay tres valores en config.txt, primera vez');
                            $('.navbar-nav a[href="#config"]').tab('show');
                        }
                        
                        callback();
                        
                    };

                    reader.readAsText(file);

                }, function(error){_error('onErrorReadFile', error)});

            }, function(error){_error('onErrorCreateFile', error)});

        }, function(error){_error('onErrorLoadFs', error)});
    },
    
    
    guardarConfig: function(){

        $("#successConfig").addClass('hidden');
        $("#errorConfig").addClass('hidden');
        $("#errorConfigMsg").text('');
        
        
        //var hogar_form = document.getElementById('hogar_form').value;
        //var madre_form = document.getElementById('madre_form').value;
        
        var hogar_form = $('#hogar_form_select').val();
        var madre_form = $('#madre_form_select').val();
        var ninio_form = $('#ninio_form_select').val();
        
        if (hogar_form.trim() != '' && madre_form.trim() != '' && ninio_form.trim() != '') {
                        
                        
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

                _log('file system open: ' + fs.name);
                fs.root.getFile("config.txt", { create: true, exclusive: false }, function (fileEntry) {

                    _log("fileEntry is file?" + fileEntry.isFile.toString());
                    // fileEntry.name == 'someFile.txt'
                    // fileEntry.fullPath == '/someFile.txt'


                    fileEntry.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function() {
                            _log("Successful file write...");
                            fileEntry.file(function (file) {
                                var reader = new FileReader();

                                reader.onloadend = function() {
                                    _log("Successful file read: " + this.result);
                                    //document.getElementById('config_content').innerHTML = (fileEntry.fullPath + ": " + this.result);
                                    
                                    $("#successConfig").removeClass('hidden');
                                    $("#errorConfig").addClass('hidden');
                                    $("#errorConfigMsg").text('');
                                    
                                    app.cargarConfig(function(){
                                        app.desplegarListasUsandoContentProvider();
                                    });
                                };

                                reader.readAsText(file);

                            }, function(error){
                                _error('onErrorReadFile', error);
                                $("#successConfig").addClass('hidden');
                                $("#errorConfig").removeClass('hidden');
                                $("#errorConfigMsg").text('No se pudo acceder al archivo actualizado.');
                            });
                        };

                        fileWriter.onerror = function (e) {
                            _error("Failed file write: " + e.toString());
                            $("#successConfig").addClass('hidden');
                            $("#errorConfig").removeClass('hidden');
                            $("#errorConfigMsg").text('No se pudo escribir en el archivo.');
                        };

                        // If data object is not passed in,
                        // create a new Blob instead.

                        var config = [
                            hogar_form,
                            madre_form,
                            ninio_form
                        ];

                        var dataObj = new Blob([config.join()], { type: 'text/plain' });

                        fileWriter.write(dataObj);
                    });

                }, function(error){
                    _error('onErrorCreateFile', error);
                    $("#successConfig").addClass('hidden');
                    $("#errorConfig").removeClass('hidden');
                    $("#errorConfigMsg").text('No se encuentra el archivo.');
                });

            }, function(error){
                _error('onErrorLoadFs', error);
                $("#successConfig").addClass('hidden');
                $("#errorConfig").removeClass('hidden');
                $("#errorConfigMsg").text('No se pudo acceder al sistema de archivos.');
            });
        } else {
            $("#successConfig").addClass('hidden');
            $("#errorConfig").removeClass('hidden');
            $("#errorConfigMsg").text('Ingrese todos los valores.');
        }
    },
    
    
    crearBotones: function(){
        var contenedor = document.getElementById('botones');
        
        [
            '/1',
            '/2',
        ].forEach(function(uri, index_uri){
            //contenedor.innerHTML += '<button onclick="uritester(\''+uri+'\'">'+uri+'</button>';
            /*
            contenedor.innerHTML += '<button id="boton'+index+'">'+uri+'</button>';
            setTimeout(function(){
                document.getElementById('boton'+index).onclick = (function(){
                    var current_uri = uri;
                    return function(){uritester(current_uri)};
                })();
            }, 100);
            */

            
            
            [
                "content://org.odk.collect.android.provider.odk.forms/forms",
                "content://org.odk.collect.android.provider.odk.instances/instances",
            ].forEach(function(prefijo, index_prefijo){
                
                var numero = index_uri + 10 + index_prefijo * 1000;
                var actual_uri = prefijo + uri;
                var boton_id = 'boton' + numero;
                
                contenedor.innerHTML += '<button id="' + boton_id + '">' + actual_uri + '</button>';
                setTimeout(function() {
                    
                    document.getElementById(boton_id).onclick = (function(){
                        var current_uri = actual_uri;
                        var current_id = boton_id;
                        
                        return function() {
                            uritester(current_uri);
                            document.getElementById(current_id).style.backgroundColor='#f00';
                        };
                    })();
                    
                    document.getElementById(boton_id).firstChild.data += "*";
                    _log('Puesto evento click en ' + boton_id, actual_uri);
                }, 500);
            });

        });
    },
    

    desplegarListasUsandoContentProvider: function(){
        _log('desplegarListasUsandoContentProvider');
        var buff;
        
        
        if (app.config && app.config.length == 3) {
            
            ['hogar', 'madre', 'ninio'].forEach(function(tipo_form){
                if (app.forms[app.config[tipo_form]]) {
                    buff = '';

                    $('#' + tipo_form + '_titulo').text(app.forms[app.config[tipo_form]].displayName);


                    //buff += '<ul>';

                    app.forms[app.config[tipo_form]].instances.forEach(function(instance, index){

                        var fecha_ultima_actualizacion = moment(parseInt(instance.date)).format('dddd D [de] MMMM [de] YYYY, HH:mm');

                        function encode_utf8(s) {
                          return unescape(encodeURIComponent(s));
                        }

                        function decode_utf8(s) {
                          return decodeURIComponent(escape(s));
                        }

                        fecha_ultima_actualizacion = decode_utf8(fecha_ultima_actualizacion);
                        _log('XXX fecha_ultima_actualizacion', fecha_ultima_actualizacion);

                        _log(instance);

                        var id = instance._id;
                        var estado = (instance.status == 'incomplete') ? 'incompleto' : 'completo';

                        buff += '<a href="#"' +
                            'class="list-group-item"' +
                            'id="editar_'+tipo_form+'"' +
                            'onclick="app.abrirInstancia('+id+')"' +
                          '>' +
                            '<h4 class="list-group-item-heading">' +
                            '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span> ' +
                            ''+instance.displayName+'</h4>' +
                            '<p class="list-group-item-text">' +
                            'Actualizado el '+fecha_ultima_actualizacion+', <strong>'+estado+'</strong></p>' +
                          '</a>';
                    });
                    //buff += '</ul>';

                    document.getElementById(tipo_form + '_content').innerHTML = buff;

                } else {
                    _error('No se puede cargar '+tipo_form+', No se encuentra formulario '+ app.forms[app.config[tipo_form]]);
                }
            });
        } else {
            _error('No se pueden desplegar listas', app.config);
        }
    },
    
    
    desplegarListas: function(){
        _log('desplegarListas');
        var buff;
        
        
        if (app.config && app.config.length == 3) {
            
            ['hogar', 'madre', 'ninio'].forEach(function(tipo_form){
                if (app.forms[app.config[tipo_form]]) {
                    buff = '';

                    $('#' + tipo_form + '_titulo').text(app.forms[app.config[tipo_form]].title);


                    //buff += '<ul>';

                    app.forms[app.config[tipo_form]].instances.forEach(function(instance, index){

                        var fecha_ultima_actualizacion = moment(instance.file.lastModifiedDate).format('dddd D [de] MMMM [de] YYYY, HH:mm');

                        function encode_utf8(s) {
                          return unescape(encodeURIComponent(s));
                        }

                        function decode_utf8(s) {
                          return decodeURIComponent(escape(s));
                        }

                        fecha_ultima_actualizacion = decode_utf8(fecha_ultima_actualizacion);
                        _log('XXX fecha_ultima_actualizacion', fecha_ultima_actualizacion);

                        _log(instance);

                        var id = instance.contentProvider._id;
                        var estado = (instance.contentProvider.status == 'incomplete') ? 'incompleto' : 'completo';

                        buff += '<a href="#"' +
                            'class="list-group-item"' +
                            'id="editar_'+tipo_form+'"' +
                            'onclick="app.abrirInstancia('+id+')"' +
                          '>' +
                            '<h4 class="list-group-item-heading">' +
                            '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span> ' +
                            ''+instance.contentProvider.displayName+'</h4>' +
                            '<p class="list-group-item-text">' +
                            'Actualizado el '+fecha_ultima_actualizacion+', <strong>'+estado+'</strong></p>' +
                          '</a>';
                    });
                    //buff += '</ul>';

                    document.getElementById(tipo_form + '_content').innerHTML = buff;

                } else {
                    _error('No se puede cargar '+tipo_form+', No se encuentra formulario '+ app.forms[app.config[tipo_form]]);
                }
            });
        } else {
            _error('No se pueden desplegar listas', app.config);
        }
    },
    
    abrirInstancia: function(id){
        _log('abrirInstancia', id);
        var sApp = startApp.set({ 
            //"action":'ACTION_VIEW', //FormEntryActivity, InstanceChooserList, FormChooserList
            "action":"ACTION_EDIT", //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_PICK", //FormChooserList

            "category":"CATEGORY_DEFAULT",

            //"type":"vnd.android.cursor.dir/vnd.odk.form", // FormChooserList
            "type":"vnd.android.cursor.dir/vnd.odk.instance", //InstanceChooserList
            //"type":"vnd.android.cursor.item/vnd.odk.form", //FormEntryActivity

            "package":'org.odk.collect.android',  

            "uri": 'content://org.odk.collect.android.provider.odk.instances/instances/' + id,

            "component": [
                "org.odk.collect.android", 
                "org.odk.collect.android.activities.FormEntryActivity"
                //"org.odk.collect.android.activities.InstanceChooserList"
                //"org.odk.collect.android.activities.FormChooserList"
            ],
        }, { 
            
        });
        
        sApp.start(function() { 
            _log("OK", id);

        }, function(error) { 
            _error('No se puede abrir instancia '+ id);
        });
    },
    
    
    cargarBddInstancias: function(){
        app.dbInstancias = window.sqlitePlugin.openDatabase({name: 'instances.db', location: 'default'});
        
        _log('app.dbInstancias', app.dbInstancias);
        
        app.dbInstancias.transaction(function(tx) {
            tx.executeSql('SELECT count(*) AS mycount FROM instances', [], function(tx, rs) {
                _log('Record count: ' + rs.rows.item(0).mycount);
            }, function(tx, error) {
                _error('SELECT error: ', error);
            });
        });
    },
    
    listarHogar: function() {

        var sApp = startApp.set({ 
            "action":'ACTION_VIEW', //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_EDIT", //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_PICK", //FormChooserList

            "category":"CATEGORY_DEFAULT",

            //"type":"vnd.android.cursor.dir/vnd.odk.form", // FormChooserList
            "type":"vnd.android.cursor.dir/vnd.odk.instance", //InstanceChooserList
            //"type":"vnd.android.cursor.item/vnd.odk.form", //FormEntryActivity

            "package":'org.odk.collect.android',  

            "uri": 'content://org.odk.collect.android.provider.odk.instances/instances/1',

            "component": [
                "org.odk.collect.android", 
                //"org.odk.collect.android.activities.FormEntryActivity"
                "org.odk.collect.android.activities.InstanceChooserList"
                //"org.odk.collect.android.activities.FormChooserList"
            ],
        }, { 
            "formpath":"/odk/forms/sample.xml", 
            "instancepath":"/odk/instances/sample_2017-08-04_00-44-23/sample_2017-08-04_00-44-23.xml"
        });

        sApp.start(function() { 
            $("#noHayExtApp").addClass('hidden');
            _log(uri, "OK");

        }, function(error) { 
            $("#noHayExtApp").removeClass('hidden');
            $("#noHayExtAppMsg").text(error);
            alert(uri, 'No se puede abrir '+ app.nombreApp + ': ' + error);
        });
        
    },

    
    editarHogar: function() {

        var sApp = startApp.set({ 
            //"action":'ACTION_VIEW', //FormEntryActivity, InstanceChooserList, FormChooserList
            "action":"ACTION_EDIT", //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_PICK", //FormChooserList

            "category":"CATEGORY_DEFAULT",

            //"type":"vnd.android.cursor.dir/vnd.odk.form", // FormChooserList
            "type":"vnd.android.cursor.dir/vnd.odk.instance", //InstanceChooserList
            //"type":"vnd.android.cursor.item/vnd.odk.form", //FormEntryActivity

            "package":'org.odk.collect.android',  

            "uri": 'content://org.odk.collect.android.provider.odk.instances/instances/1',

            "component": [
                "org.odk.collect.android", 
                //"org.odk.collect.android.activities.FormEntryActivity"
                "org.odk.collect.android.activities.InstanceChooserList"
                //"org.odk.collect.android.activities.FormChooserList"
            ],
        }, { 
            "formpath":"/odk/forms/sample.xml", 
            "instancepath":"/odk/instances/sample_2017-08-04_00-44-23/sample_2017-08-04_00-44-23.xml"
        });

        sApp.start(function() { 
            $("#noHayExtApp").addClass('hidden');
            _log(uri, "OK");

        }, function(error) { 
            $("#noHayExtApp").removeClass('hidden');
            $("#noHayExtAppMsg").text(error);
            alert(uri, 'No se puede abrir '+ app.nombreApp + ': ' + error);
        });
    },


    abrirHogar: function() {
        _log('abrirHogar');
        app.abrir('hogar');
    },
    
    abrirMadre: function() {
        _log('abrirMadre');
        app.abrir('madre');
    },
    
    abrirNinio: function() {
        _log('abrirNinio');
        app.abrir('ninio');
    },

    abrir: function(tipo) {
        _log('abrir', tipo);
        
        //var index = app.forms[app.config[tipo]].index;
        //var index = app.forms.map(function(f) { return f.id; }).indexOf(app.config[tipo]);
        //var id = index + 1;
        var id = app.forms[app.config[tipo]]._id;
        
        _log('tipo', tipo, 'id', id, app.config[tipo], app.forms[app.config[tipo]]);

        var sApp = startApp.set({ 
            "action":'ACTION_VIEW', //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_EDIT", //FormEntryActivity, InstanceChooserList, FormChooserList
            //"action":"ACTION_PICK", //FormChooserList

            "category":"CATEGORY_DEFAULT",

            //"type":"vnd.android.cursor.dir/vnd.odk.form", // FormChooserList
            //"type":"vnd.android.cursor.dir/vnd.odk.instance", //InstanceChooserList
            "type":"vnd.android.cursor.item/vnd.odk.form", //FormEntryActivity

            "package":'org.odk.collect.android',  

            "uri": 'content://org.odk.collect.android.provider.odk.forms/forms/'  + id,

            "component": [
                "org.odk.collect.android", 
                "org.odk.collect.android.activities.FormEntryActivity"
                //"org.odk.collect.android.activities.InstanceChooserList"
                //"org.odk.collect.android.activities.FormChooserList"
            ],
        }, { 
            //"formpath":"/odk/forms/sample.xml", 
            //"instancepath":"/odk/instances/sample_2017-08-04_00-44-23/sample_2017-08-04_00-44-23.xml"
        });

        sApp.start(function() { 
            $("#noHayExtApp").addClass('hidden');
            //_log(uri, "OK");

        }, function(error) { 
            $("#noHayExtApp").removeClass('hidden');
            $("#noHayExtAppMsg").text(error);
            alert(uri, 'No se puede abrir '+ app.nombreApp + ': ' + error);
        });
    },
    

    
    mostrarContenidoCarpeta: function(url){
        _log('ABIERTO', url);
                    
        window.resolveLocalFileSystemURL(
            url, 
            function(fileSystem) {
                _log('FILESYSTEM: ', fileSystem);

                // create a directory reader
                var directoryReader = fileSystem.createReader();
                // Get a list of all the entries in the directory
                directoryReader.readEntries(

                    function (entries){

                        _log('ENTRIES: ', entries);

                        // alphabetically sort the entries based on the entry's name
                        entries.sort(function(a,b){return (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)});

                        //  start constructing the view
                        var list = '<strong>' + fileSystem.nativeURL + '</strong><hr><ul>';
                        var skip = null;
                        for (var i = 0; i < entries.length; i++){
                            // should we hide "system" files and directories?
                            //if (app.util.getPref && app.util.getPref('hideSystem')){
                            //skip = entries[i].name.indexOf('.') == 0;
                            //}
                            if (entries[i].name.indexOf('.') != 0){
                                list += '<p><img width="20" height="20" src="img/' + (entries[i].isFile ? 'file-flat':'folder-open-flat') + '.png"/> &nbsp;' + entries[i].name + 
                                      '</p>';
                            }
                        }
                        // insert the list into our container
                        document.getElementById('lista').innerHTML = list + '</ul>';
                    },

                    function(error){_error(error);}
                );
            },
            function(error){
                _error(error);
            }
        );
    },
    
    
    ejecutarRespaldo: function() {
        _log('ejecutarRespaldo');
        $("#respaldando").removeClass('hidden');
        
        app.analizarFileSystem(app.crearRespaldo);
    },
    
    analizarFileSystem: function(callback) {
        _log('analizarFileSystem');
        function _error (msg, error) {
            error = error|null;
            
            msg = typeof(error) == 'undefined' ? msg : msg + '. Código de error: '+ error.code;
            
            _error(msg, error);

            $("#respaldando").addClass('hidden');
            $("#successRespaldo").addClass('hidden');
            $("#errorRespaldo").removeClass('hidden');
            $("#errorRespaldoMsg").text(msg);
        };
        

        //alert(1)
/*
        [
            cordova.file.applicationDirectory,
            cordova.file.applicationStorageDirectory,
            cordova.file.dataDirectory,
            cordova.file.cacheDirectory,
            cordova.file.externalApplicationStorageDirectory,
            cordova.file.externalDataDirectory,
            cordova.file.externalCacheDirectory,
            cordova.file.externalRootDirectory,
            'cdvfile://localhost/sdcard/',
            'file:///storage',
            'file:///storage/6463-6135',
            'file:///storage/6463-6135/Android/data/org.paho.caratula/',
            'file:///storage/emulated/0',
            'file:///storage/sdcard0',
            'file:///storage/sdcard1/Android/data/org.paho.caratula/',
            'file:///storage/sdcard1',
            
            'file:///storage/enc_emulated',
            'file:///storage/self'
        ].forEach(function(url){
            app.mostrarContenidoCarpeta(url);
        });
*/
        //_error('prueba');
        
        //$("#respaldando").removeClass('hidden');
        $("#successRespaldo").addClass('hidden');
        $("#errorRespaldo").addClass('hidden');
        $("#errorRespaldoMsg").text('');
        $("#successRespaldoMsg").text('');
        
        
        window.resolveLocalFileSystemURL(
            cordova.file.externalRootDirectory, 
            function(ExternalFileSystem) {
                var nativeURLarray = ExternalFileSystem.nativeURL.replace('file:///', '').split('/');
                if (nativeURLarray[0]) {
                    var baseURL = 'file:///' + nativeURLarray.shift() + '/';
                    
                    _log('baseURL', baseURL);
                    
                    window.resolveLocalFileSystemURL(
                        baseURL,
                        function(baseFileSystem) {
                            
                            _log('baseFileSystem', baseFileSystem);

                            baseFileSystem.createReader().readEntries(
                                function (entries){
                                    
                                    entries.push({name:nativeURLarray.join('/')});
                                    
                                    _log('entries',entries);
                                    
                                    var opcionesFileSystem = [];
                                    
                                    entries.forEach(function(entry){
                                        if (entry.name.indexOf('.') != 0) {
                                            
                                            var opcionFileSystem = {
                                                cantidadFicheros: -1,
                                                tieneCarpetaODK: false,
                                                tieneCarpetaAndroid: false,
                                                url: null
                                            };
                                            
                                            window.resolveLocalFileSystemURL(
                                                baseFileSystem.nativeURL + entry.name,
                                                function (localFileSystem) {
                                                    
                                                    _log('localFileSystem', localFileSystem);
                                                    
                                                    opcionFileSystem.url = localFileSystem.nativeURL;
                                                    
                                                    localFileSystem.createReader().readEntries(
                                                        
                                                        function (localEntries){
                                                            
                                                            _log('localEntries', localEntries);
                                                            
                                                            opcionFileSystem.cantidadFicheros = localEntries.length;
                                                            
                                                            
                                                            localEntries.forEach(function(localEntry){
                                                                if (localEntry.name === 'odk') {
                                                                    opcionFileSystem.tieneCarpetaODK = true;
                                                                }
                                                                if (localEntry.name === 'Android') {
                                                                    opcionFileSystem.tieneCarpetaAndroid = true;
                                                                }
                                                            });
                                                            
                                                            _log('opcionFileSystem', opcionFileSystem);
                                                            
                                                            opcionesFileSystem.push(opcionFileSystem);
                                                            
                                                            _log('opcionesFileSystem', opcionesFileSystem);
                                                            
                                                            if (opcionesFileSystem.length == entries.length) {
                                                                
                                                                _log('entries.length', entries.length);
                                                                
                                                                app.tieneODK = null;
                                                                app.esSD = null;
                                                                //var candidatoSD = null;

                                                                opcionesFileSystem.forEach(function(opcionFileSystem){
                                                                    if (opcionFileSystem.tieneCarpetaODK) {
                                                                        window.app.tieneODK = opcionFileSystem.url;
                                                                        _log('app.tieneODK opcionFileSystem.url', opcionFileSystem.url);
                                                                    } else if (opcionFileSystem.cantidadFicheros > 0 && opcionFileSystem.tieneCarpetaAndroid) {
                                                                        window.app.esSD = opcionFileSystem.url;
                                                                        _log('app.esSD opcionFileSystem.url', opcionFileSystem.url);
                                                                    //} else {
                                                                    //    candidatoSD = opcionFileSystem.url;
                                                                    }

                                                                });
                                                                
                                                                callback();
                                                            }
                                                        },
                                                        function (error) {
                                                            _error('No se pudo listar al sistema de archivos ' + localFileSystem.nativeURL, error);
                                                        }

                                                    );
                                                },
                                                function (error) {
                                                    _error('No se pudo acceder al sistema de archivo' + baseFileSystem.nativeURL + entry.name, error);
                                                }
                                            );
                                        }
                                    });
                                },
                                function (error) {
                                    _error('No se pudo listar a los sistemas de archivos en ' + baseFileSystem.nativeURL, error);
                                }
                            );
                        },
                        function (error) {
                            _error('No se pudo acceder a los sistemas de archivos', error);
                        }
                    );
                    
                } else {
                    _error('No se pudo acceder al sistema de archivos del dispositivo.');
                }
            }, 
            function (error) {
                _error('No se pudo acceder a la SD', error);
            }
        );

        
        
        
/*
        window.resolveLocalFileSystemURL(
            cordova.file.externalRootDirectory, 
            function(fileSystem) {
                _log('Abierto el FileSystem: ' + fileSystem.name, fileSystem);
                
                var odk_dir = '/odk/';
                //var odk_dir = 'cdvfile://localhost/persistent|temporary|another-fs-root/path/to/file';
                //var odk_dir = 'cdvfile://localhost/persistent/odk/';
                //var odk_dir = 'cdvfile://localhost/root/odk/';
                //var odk_dir = 'cdvfile://localhost/odk/';
                
                _log("Root = ", odk_dir);
                fileSystem.getDirectory(
                    odk_dir,
                    //'cdvfile://localhost/persistent|temporary|another-fs-root/path/to/file',
                    //cordova.file.externalRootDirectory + "respaldos", 
                    //cordova.file.applicationStorageDirectory + 'odk/instances/',
                    //fileSystem.root + 'odk/instances/',
                    {create: true, exclusive: false},
                    

                    function(dirEntry) {
                        _log("copyTo= " + cordova.file.externalRootDirectory);
                        
                        
                        var d = new Date;
                        var dformat = d.getFullYear() + 
                            ("00" + (d.getMonth() + 1)).slice(-2) + 
                            ("00" + d.getDate()).slice(-2) + 
                            "-" + 
                            ("00" + d.getHours()).slice(-2) + 
                            ("00" + d.getMinutes()).slice(-2) + 
                            ("00" + d.getSeconds()).slice(-2);
                        
                        fileSystem.getDirectory(
                            'respaldo', 
                            { create: true }, 
                            function (dirRespaldos) {
                                dirEntry.copyTo(
                                    dirRespaldos,
                                    dformat,
                                    function(respFileEntry){
                                        //success
                                        _log('Respaldado todo ok', dformat, respFileEntry);
                                        
                                        $("#respaldando").addClass('hidden');
                                        
                                        $("#successRespaldo").removeClass('hidden');
                                        $("#successRespaldoMsg").text(respFileEntry.fullPath);
                                        
                                        $("#errorRespaldo").addClass('hidden');
                                    },
                                    function(error){
                                        var msg = 'No se pudo copiar a la SD. Código de error ' + error.code;
                                        _error(msg, error);
                                        
                                        $("#respaldando").addClass('hidden');
                                        $("#successRespaldo").addClass('hidden');
                                        $("#errorRespaldo").removeClass('hidden');
                                        $("#errorRespaldoMsg").text(msg);
                                        
                                    }
                                );
                            },
                            function(error){
                                var msg = 'No se pudo acceder a la carpeta de respaldos. Código de error ' + error.code;
                                _error(msg, error);
                                
                                $("#respaldando").addClass('hidden');
                                $("#successRespaldo").addClass('hidden');
                                $("#errorRespaldo").removeClass('hidden');
                                $("#errorRespaldoMsg").text(msg);
                            }                            
                        );
                      
                    }, 

                    function (error) {
                        var msg = 'No se pudo acceder al directorio del ODK Collect. Código de error ' + error.code;
                        _error(msg, error);
                        
                        $("#respaldando").addClass('hidden');
                        $("#successRespaldo").addClass('hidden');
                        $("#errorRespaldo").removeClass('hidden');
                        $("#errorRespaldoMsg").text(msg);

                    }
                );
           }, 
           function (error) {
               var msg = 'No se pudo acceder a la SD. Código de error ' + error.code;
               _error(msg, error);
               
                $("#respaldando").addClass('hidden');
                $("#successRespaldo").addClass('hidden');
                $("#errorRespaldo").removeClass('hidden');
                $("#errorRespaldoMsg").text(msg);

           }
       );
*/

    
    },
    
 /*   
    registrarOpcionesFileSystem: function(opcionesFileSystem) {
        _log('registrarOpcionesFileSystem', opcionesFileSystem);
        
        app.tieneODK = null;
        app.esSD = null;
        //var candidatoSD = null;
        
        opcionesFileSystem.forEach(function(opcionFileSystem){
            if (opcionFileSystem.tieneCarpetaODK) {
                app.tieneODK = opcionFileSystem.url;
            } else if (opcionFileSystem.cantidadFicheros > 0 && opcionFileSystem.tieneCarpetaAndroid) {
                app.esSD = opcionFileSystem.url;
            //} else {
            //    candidatoSD = opcionFileSystem.url;
            }
            
        });
        
        crearRespaldo();
    },
 */
 
    crearRespaldo: function() {
        
        //esSD = (esSD == null) ? candidatoSD : esSD;
        
        if (app.tieneODK != null) {
        
            var directorio_de_respado = (app.esSD == null) ? app.tieneODK : app.esSD;

            //esSD += 'Android/data/org.paho.caratula/';
            directorio_de_respado += 'Android/data/' + BuildInfo.packageName;

            _log('tieneODK', app.tieneODK);
            _log('esSD', app.esSD);
            _log('directorio_de_respado', directorio_de_respado);

            window.resolveLocalFileSystemURL(
                app.tieneODK, 
                function(tieneOdkFileSystem) {
                    _log('Abierto el tieneOdkFileSystem: ', tieneOdkFileSystem);

                    var odk_dir = 'odk';
                    //var odk_dir = 'cdvfile://localhost/persistent|temporary|another-fs-root/path/to/file';
                    //var odk_dir = 'cdvfile://localhost/persistent/odk/';
                    //var odk_dir = 'cdvfile://localhost/root/odk/';
                    //var odk_dir = 'cdvfile://localhost/odk/';

                    _log("odk_dir = ", odk_dir);
                    tieneOdkFileSystem.getDirectory(
                        odk_dir,
                        //'cdvfile://localhost/persistent|temporary|another-fs-root/path/to/file',
                        //cordova.file.externalRootDirectory + "respaldos", 
                        //cordova.file.applicationStorageDirectory + 'odk/instances/',
                        //fileSystem.root + 'odk/instances/',
                        {create: false, exclusive: false},


                        function(dirEntry) {

                            var d = new Date;
                            var dformat = d.getFullYear() + 
                                ("00" + (d.getMonth() + 1)).slice(-2) + 
                                ("00" + d.getDate()).slice(-2) + 
                                "-" + 
                                ("00" + d.getHours()).slice(-2) + 
                                ("00" + d.getMinutes()).slice(-2) + 
                                ("00" + d.getSeconds()).slice(-2);


                            window.resolveLocalFileSystemURL(
                                directorio_de_respado, 
                                function(respaldoFileSystem) {

                                    respaldoFileSystem.getDirectory(
                                        'odkrespaldo', 
                                        { create: true, exclusive: false }, 
                                        function (dirRespaldos) {
                                            dirEntry.copyTo(
                                                dirRespaldos,
                                                dformat,
                                                function(respFileEntry){
                                                    //success
                                                    _log('Respaldado todo ok', dformat, respFileEntry);

                                                    $("#respaldando").addClass('hidden');

                                                    $("#successRespaldo").removeClass('hidden');
                                                    $("#successRespaldoMsg").text(dformat);

                                                    $("#errorRespaldo").addClass('hidden');
                                                    
                                                    
                                                    
                                                    app.mostrarContenidoCarpeta(directorio_de_respado + '/odkrespaldo');
                                                    //app.mostrarContenidoCarpeta('file://' + dirEntry.fullPath);
                                                    //app.mostrarContenidoCarpeta('file://' + respFileEntry.fullPath);
                                                },
                                                function(error){
                                                    var msg = 'No se pudo copiar a la SD. Código de error ' + error.code;
                                                    _error(msg, error);

                                                    $("#respaldando").addClass('hidden');
                                                    $("#successRespaldo").addClass('hidden');
                                                    $("#errorRespaldo").removeClass('hidden');
                                                    $("#errorRespaldoMsg").text(msg);

                                                }
                                            );
                                        },
                                        function(error){
                                            var msg = 'No se pudo acceder a la carpeta de respaldos. Código de error ' + error.code;
                                            _error(msg, error);

                                            $("#respaldando").addClass('hidden');
                                            $("#successRespaldo").addClass('hidden');
                                            $("#errorRespaldo").removeClass('hidden');
                                            $("#errorRespaldoMsg").text(msg);
                                        }                            
                                    );

                                },
                                function (error) {
                                    var msg = 'No se pudo acceder a la SD. Código de error ' + error.code;
                                    _error(msg, error);

                                    $("#respaldando").addClass('hidden');
                                    $("#successRespaldo").addClass('hidden');
                                    $("#errorRespaldo").removeClass('hidden');
                                    $("#errorRespaldoMsg").text(msg);

                                }
                            );




                        }, 

                        function (error) {
                            var msg = 'No se pudo acceder al directorio del ODK Collect. Código de error ' + error.code;
                            _error(msg, error);

                            $("#respaldando").addClass('hidden');
                            $("#successRespaldo").addClass('hidden');
                            $("#errorRespaldo").removeClass('hidden');
                            $("#errorRespaldoMsg").text(msg);

                        }
                    );
               }, 
               function (error) {
                   var msg = 'No se pudo acceder a la raiz donde está la carpeta ODK [' + directorio_de_respado + ']. Código de error ' + error.code;
                   _error(msg, error);

                    $("#respaldando").addClass('hidden');
                    $("#successRespaldo").addClass('hidden');
                    $("#errorRespaldo").removeClass('hidden');
                    $("#errorRespaldoMsg").text(msg);

               }
           );
        } else {
           var msg = 'No se encuentra la carpeta de ODK Collect';
           _error(msg);

            $("#respaldando").addClass('hidden');
            $("#successRespaldo").addClass('hidden');
            $("#errorRespaldo").removeClass('hidden');
            $("#errorRespaldoMsg").text(msg);
        }
    }
};

function uritester(uri) {
    var sApp = startApp.set({ 
        "action":'ACTION_VIEW', //FormEntryActivity, InstanceChooserList, FormChooserList
        //"action":"ACTION_EDIT", //FormEntryActivity, InstanceChooserList, FormChooserList
        //"action":"ACTION_PICK", //FormChooserList
        //"action":"ACTION_MAIN", //SplashScreenActivity
        //"action":"ACTION_CREATE_SHORTCUT", //AndroidShortcuts
        
        "category":"CATEGORY_DEFAULT",
        //"category":"CATEGORY_LAUNCHER", //SplashScreenActivity
        
        //"type":"vnd.android.cursor.dir/vnd.odk.form", // FormChooserList
        "type":"vnd.android.cursor.dir/vnd.odk.instance", //InstanceChooserList
        //"type":"vnd.android.cursor.item/vnd.odk.form", //FormEntryActivity
        
        "package":'org.odk.collect.android',  
        //"package":'org.odk.collect.android.action.FormEntry',
        
        "uri": uri,
        
        //"flags":["FLAG_ACTIVITY_CLEAR_TOP","FLAG_ACTIVITY_CLEAR_TASK"],
        
        "component": [
            "org.odk.collect.android", 
            //"org.odk.collect.android.activities.FormEntryActivity"
            "org.odk.collect.android.activities.InstanceChooserList"
            //"org.odk.collect.android.activities.FormChooserList"
            //"org.odk.collect.android.activities.SplashScreenActivity"
            //"org.odk.collect.android.activities.AndroidShortcuts"
        ],
        
        //"intentstart":"startActivity",
    }, { //// extras 
        "formpath":"/odk/forms/sample.xml", //../tables/tableid/forms/formid/  //https://opendatakit.org/use/2_0_tools/older-versions/survey/
        "instancepath":"/odk/instances/sample_2017-08-04_00-44-23/sample_2017-08-04_00-44-23.xml" //instancedestination
    });

    sApp.start(function() { /* success */
        $("#noHayExtApp").addClass('hidden');
        _log(uri, "OK");

    }, function(error) { /* fail */
        $("#noHayExtApp").removeClass('hidden');
        $("#noHayExtAppMsg").text(error);
        alert(uri, 'No se puede abrir '+ app.nombreApp + ': ' + error);
    });
    
    sApp.check(function(values) { /* success */
        _log('CHECK:', values);
    }, function(error) { /* fail */
        _log('ERROR en check: ', error);
    });
    
    window.startApp.getExtras(function(fields) { /* success */
        _log('extraFields: ', fields);
    }, function() { /* fail */
        _log('ERROR en extraFields');
    });
}

app.initialize();
//AndroidExtraFilesystems: files,files-external,documents,sdcard,cache,cache-external,assets,root
//<preference name="AndroidPersistentFileLocation" value="Compatibility" />

function _error(){
    
    if (app.ambiente == 'desarrollo') {
        var resultado = '', buff;

        console.error.apply(console, arguments);

        for (var i = 0; i < arguments.length; i++){
            //console.error(arguments[i]);

            buff = JSON.stringify(arguments[i]);
            resultado += '<div class="alert alert-danger">'+buff+'</div>';
        }

        resultado += '<hr>';



        document.getElementById('log').innerHTML += resultado;
    }
}

function _log(){ 
    if (app.ambiente == 'desarrollo') {
    
        var resultado = '', buff;

        console.log.apply(console, arguments);

        for (var i = 0; i < arguments.length; i++){
            //console.log(arguments[i]);
            buff = JSON.stringify(arguments[i]);
            resultado += '<div class="alert alert-info">'+buff+'</div>';
        }

        resultado += '<hr>';

        document.getElementById('log').innerHTML += resultado;
    }
}
_log('prueba');