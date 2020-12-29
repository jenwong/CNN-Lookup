// require hogan
var resultStringTemplate = Hogan.compile("{{CNN}} {{street1}} {{street2}} {{street3}} {{street4}} {{street5}}");

function rowString(row) {
  return resultStringTemplate.render(row);
}

function prettyRowString(row) {
  return rowString(row);
}

function queryTokenizer(str) {
  // Tokenizes on whitespace, removes 'and' or '&' when 
  // there is more than one token
  var tokens = Bloodhound.tokenizers.whitespace(str);
  tokens = tokens.filter(function(token){
    var tokenIsAnd = /^(and)$|^&$/i.test(token);
    return tokenIsAnd ? (tokens.length == 1) : true; 
  });
  return tokens;
}

function addOrPromoteObjectInArray(array, obj) {
  var oldIndex = array.indexOf(obj);
  if( oldIndex > -1) {
    array.splice(oldIndex, 1);
    array.splice(0, 0, obj);
  } else {
    array.unshift(obj);
  }
}

angular.module('search', []).controller('Main', ['$scope', function($scope) {

  $scope.streets = {
    'csvKeys' : ['street1', 'street2', 'street3', 'street4', 'street5'],
    'prettyNames' : ['Street 1', 'Street 2', 'Street 3', 'Street 4', 'Street 5'],
    'csvKeysAndNames' : [
      { key: 'street1', name: 'Street 1' },
      { key: 'street2', name: 'Street 2' }, 
      { key: 'street3', name: 'Street 3' }, 
      { key: 'street4', name: 'Street 4' }, 
      { key: 'street5', name: 'Street 5' }]
  }

  d3.csv('./data/intersections.csv', function(d) {
    // Edit data model here.
    return d;
  }, function(dataset) {
    // Setup page w/ data here.
    // constructs the suggestion engine
    $scope.totalRows = dataset.length;
    $scope.cnnSelectionHistory = [];
    $scope.selectSuggestion = function(suggestion) {
      $scope.selectedCNN = suggestion.data;
      addOrPromoteObjectInArray($scope.cnnSelectionHistory, suggestion.data);
      // var oldIndex = $scope.cnnSelectionHistory.indexOf(suggestion.data);
      // if( oldIndex > -1) {
      //   $scope.cnnSelectionHistory.splice(oldIndex, 1);
      //   $scope.cnnSelectionHistory.splice(0, 0, suggestion.data);
      // } else {
      //   $scope.cnnSelectionHistory.unshift(suggestion.data);
      // }
      //  //AngularJS ng-repeat doesn't like duplicates
    };

    $scope.selectHistoryItem = function(item) {
      $scope.selectedCNN = item;
    }

    $scope.$apply();
    var trafficHound = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
      queryTokenizer: queryTokenizer,
      // Bloodhound.tokenizers.whitespace,
      limit: 101,
      local: $.map(dataset, function(row) { 
        return { 
          data: row,
          value: rowString(row),
          displayValue: prettyRowString(row),
          CNN: row['CNN']
        }; 
      })
    });
     
    // kicks off the loading/processing of `local` and `prefetch`
    trafficHound.initialize();

    $scope.$watch('searchText', function(newValue, oldValue) {
      var query = newValue;
      trafficHound.get(query, function(suggestions) {
        $scope.suggestions = suggestions;
        $scope.matchingSuggestionsCount = (suggestions.length > 100) ? '100+' : suggestions.length;
      });
    }); //end $scope.$watch
  });//end d3.csv
}]);//end .controller

