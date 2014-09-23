Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'button_box', layout: 'hbox'},
        {xtype:'container',itemId:'artifact_box', layout: 'vbox', flex: 1},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        this.down('#button_box').add({
            xtype: 'rallybutton',
            text: 'Choose Story...',
            margin: this._getPrettyMargin(),
            scope: this,
            handler: this._chooseArtifact
        });
        this.down('#button_box').add({
            xtype: 'container',
            itemId: 'artifact_summary_box',
            padding: 15,
            tpl:'<tpl>{FormattedID}:  {Name}</tpl>'
            
        });
        

     },
     _chooseArtifact: function(){
         this.logger.log('_chooseArtifact');
         var chooser = Ext.create('Rally.ui.dialog.SolrArtifactChooserDialog',{
             artifactTypes: ['userstory'],
             height: 250,
             modal: true,
             title: 'Choose User Story',
             listeners: {
                 scope: this,
                 artifactChosen: this._artifactSelected
             }
         });
         
         chooser.show();
     },
     _artifactSelected: function(acd, rec){
         //Update Artifact information 
         var data = rec.getData();
         this.down('#artifact_summary_box').update(data);

         var artifact_test_set = this._loadArtifactScenarios(rec).then({
             scope: this,
             success: function(scenarios){
                 this._renderScenarios(scenarios);
             },
             failure: function(error){
                 alert(Ext.String.format('Error loading Scenarios for artifact "{0}". [{1}]',rec.get('Name'),error));
             }
         });
         
     },
     _loadArtifactScenarios: function(artifact){
         this.logger.log('_loadArtifactScenarios', artifact)
         var deferred = Ext.create('Deft.Deferred');
         //Get test set where name = formattedid 
         //return test cases
         //return empty array if no test cases
         deferred.resolve([]);
         return deferred.promise;
     },
     _renderScenarios: function(scenarios){
         this.logger.log('_renderScenarios', scenarios)
         Ext.Array.each(scenarios, function(scenario){
             this._renderScenario(scenario);
         }, this);
         this._addNewScenarioButton('#artifact_box');
         
     },
     _renderScenario: function(scenario){
         this.down('#artifact_box').add({
             xtype: 'rallytsfieldbucket',
             record: rec,
             style: 'display: table; width: 100%; table-layout: fixed;',
         });
     },
     _addScenario: function(artifact){
         this.logger.log('_addScenario', artifact);
         //if no test set, then {
         //add a new test set 
         //associate with artifact
         //}
         
         //create a new test case 
         alert('add scenario');
     },
     _addNewScenarioButton: function(container_id){
         this.down(container_id).add({
             scope: this,
             xtype: 'rallybutton',
             text: '+Add Scenario',
             margin: this._getPrettyMargin(),
             handler: this._addScenario
         });
     },
     _getPrettyMargin: function(){ return 10;}
     

});