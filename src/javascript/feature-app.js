Ext.define('CustomApp-Feature', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'artifact_box', layout: 'hbox', padding: 25},
        {xtype:'container',itemId:'scenario_box', layout: 'vbox', padding: 25},
        {xtype:'tsinfolink'}
    ],
    portfolio_item_name: 'Feature', //TODO get low level pi name
    launch: function() {
        this._buildArtifactBox();

     },
     _chooseArtifact: function(){
         var title = Ext.String.format('Choose {0}',this.portfolio_item_name);
         var artifact_name = Ext.String.format('portfolioitem/{0}',this.portfolio_item_name.toLowerCase());
         
         this.logger.log('_chooseArtifact');
         var chooser = Ext.create('Rally.ui.dialog.SolrArtifactChooserDialog',{
             artifactTypes: [artifact_name],
             modal: true,
             title: title,
             listeners: {
                 scope: this,
                 artifactChosen: this._buildFeatureFile
             }
         });
         chooser.show();
     },
     _buildArtifactBox: function(){
         var button_text = Ext.String.format('Choose {0}...',this.portfolio_item_name);
         this.down('#artifact_box').add({
             xtype: 'rallybutton',
             text: button_text,  //TODO get actual low level pi name
             scope: this,
             handler: this._chooseArtifact
         });
         
         this.down('#artifact_box').add({
             xtype:'rallybutton',
             text: 'Save',
             itemId: 'save-file',
             scope: this,
             disabled: true,
             handler: this._saveFile
         });
//         this.down('#artifact_box').add({
//             xtype: 'container',
//             itemId: 'artifact_summary_box',
//             cls: 'title',
//             tpl:'<tpl>{FormattedID}:  {Name}</tpl>'
//         });
     },
     _saveFile: function(){
         this.logger.log('_saveFile');
     },
     _buildFeatureFile: function(blah, artifact){
         this.logger.log('_getArtifactFileTreeStore');
         var deferred = Ext.create('Deft.Deferred');
         
         var sc_ids = [];
         this._getContainerRecords(artifact.get('_ref')).then({
             scope: this,
             success: function(container_records){
                 console.log('getcontainerrecords success', container_records);
                 this._getScenarioRecords(container_records).then({
                     scope: this,
                     success: function(scenario_records){
                         this._buildTreeStore(artifact, container_records, scenario_records);
                       
                     }
                 });
             }
         });
     },
     _getContainerRecords: function(artifact_ref){
         this.logger.log('_getContainerRecords');
         var deferred = Ext.create('Deft.Deferred');
         
         var store = Ext.create('Rally.data.wsapi.Store', {
             model: 'userstory',
             filters: [{property: 'PortfolioItem', value: artifact_ref}],
             autoLoad: true,
             listeners: {
                 load: function(store, data, success) {
                     deferred.resolve(store.getRecords());
                 }
             },
             fetch: ['Name', 'FormattedID', 'Description']
         });
         return deferred.promise; 
     },
     _getScenarioRecords: function(container_records){
         this.logger.log('_getScenarioRecords');
         var deferred = Ext.create('Deft.Deferred');
         
         var filter = null;
         Ext.each(container_records, function(cr){
             var f  = Ext.create('Rally.data.wsapi.Filter', {
                 property: 'TestFolder.Name',
                 operator: '=',
                 value: cr.get('FormattedID')
            });
            
            if (filter) {
                filter = filter.or(f);
            } else {
                filter = f;
            }
             
         },this);
         
         this.logger.log('_getScenarioRecords filter=', filter.toString());
         var store = Ext.create('Rally.data.wsapi.Store', {
             model: 'testcase',
             filters: [filter],
             autoLoad: true,
             listeners: {
                 load: function(store, data, success) {
                     console.log('testcases', store.getRecords());
                     deferred.resolve(store.getRecords());
                 }
             },
             fetch: ['Name', 'FormattedID', 'Description', 'TestFolder','Name']
         });
         return deferred.promise; 
     },
     _buildTreeStore: function(artifact, containers, scenarios){
         this.logger.log('_buildTreeStore');
         
         var tree_data = {};
         tree_data['FormattedID'] = artifact.get('FormattedID');
         tree_data['Name'] = artifact.get('Name');
         tree_data['Description'] = artifact.get('Description');
         tree_data['children'] = [];
         Ext.each(containers, function(container){
             var tree_data_child = {};
             tree_data_child['FormattedID'] = container.get('FormattedID');
             tree_data_child['Name'] = container.get('Name');
             tree_data_child['Description'] = container.get('Description');
             tree_data_child['children'] = [];
             Ext.each(scenarios, function(scenario){
                 var scenario_parent = scenario.get('TestFolder').Name;
                 if (scenario_parent == container.get('FormattedID')){
                     var tree_data_grandchild = {};
                     tree_data_grandchild['FormattedID'] = scenario.get('FormattedID');
                     tree_data_grandchild['Name'] = scenario.get('Name');
                     tree_data_grandchild['Description'] = scenario.get('Description');
                }
                 tree_data_child['children'].push(tree_data_grandchild);
             });
             tree_data['children'].push(tree_data_child);
            }, this);
         
         this._renderFeatureFile(tree_data);
     },
     _renderFeatureFile: function(data){
         this.logger.log('_renderFeatureFile');
         
         var feature_tpl = '<p>{FormattedID}</p><p>Feature: {Name}</p>';
         var story_tpl = '<p>{FormattedID}</p><p>{Name}</p><p>{Description}</p>';
         var scenario_tpl = '<p>{FormattedID}</p><p>Scenario: {Name}</p><p>{Description}</p>';
         
         this.down('#scenario_box').add({
             xtype: 'component',
             tpl: feature_tpl,
             data: data,
             cls: 'ts-feature'
         }); 
         
         Ext.each(data['children'], function(child){
             this.down('#scenario_box').add({
                 xtype: 'component',
                 tpl: story_tpl,
                 data: child,
                 cls: 'ts-story'
             });
             Ext.each(child['children'], function(ch){
                 this.down('#scenario_box').add({
                     xtype: 'component',
                     tpl: scenario_tpl,
                     data: ch,
                     cls: 'ts-scenario'
                 });
             }, this);
             
         },this);
         this.down('#save-file').setDisabled(false);    
     }

});