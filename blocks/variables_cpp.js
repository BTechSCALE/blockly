/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Variable blocks for Blockly.

 * This file is scraped to extract a .json file of block definitions. The array
 * passed to defineBlocksWithJsonArray(..) must be strict JSON: double quotes
 * only, no outside references, no functions, no trailing commas, etc. The one
 * exception is end-of-line comments, which the scraper will remove.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Blocks.variables');  // Deprecated.
goog.provide('Blockly.Constants.Variables');

goog.require('Blockly');
goog.require('Blockly.Blocks');
goog.require('Blockly.FieldLabel');
goog.require('Blockly.FieldVariable');


/**
 * Unused constant for the common HSV hue for all blocks in this category.
 * @deprecated Use Blockly.Msg['VARIABLES_HUE']. (2018 April 5)
 */
Blockly.Constants.Variables.HUE = 330;

Blockly.Constants.Variables.VariableTypes = [
  [Blockly.Msg.VARIABLES_SET_TYPE_INT, 'int'],
//    [Blockly.Msg.VARIABLES_SET_TYPE_UNSIGNED_INT, 'unsigned int'],
//    [Blockly.Msg.VARIABLES_SET_TYPE_FLOAT, 'float'],
  [Blockly.Msg.VARIABLES_SET_TYPE_DOUBLE, 'double'],
  [Blockly.Msg.VARIABLES_SET_TYPE_CHAR, 'char'],
//    [Blockly.Msg.VARIABLES_SET_TYPE_STRING, 'std::string']
];

Blockly.Blocks['variables_declare'] = {
  init: function(dist) {
    this.setColour(350);

    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField(Blockly.Msg.VARIABLES_DECLARE)
        .appendField(new Blockly.FieldDropdown(Blockly.Constants.Variables.VariableTypes), "TYPE")
        .appendField(Blockly.Msg.VARIABLES_DECLARE_TITLE)
        .appendField(new Blockly.FieldTextInput(Blockly.Msg.VARIABLES_DECLARE_DEFAULT_NAME), "VAR")
        .appendField(Blockly.Msg.VARIABLES_DECLARE_INIT);
    this.setPreviousStatement(true, ["STATEMENT", "DEC"]);
    this.setNextStatement(true, ["STATEMENT", "DEC"]);
    this.setTooltip(Blockly.Msg.VARIABLES_DECLARE_TOOLTIP);
  },

  getDist: function() {
    return 'v';
  },

  getType: function() {
    return this.getFieldValue('TYPE');
  },

  getVar: function() {
    return this.getFieldValue('VAR');
  },

  getSpec: function() {
    return null;
  },

  /**
   * Return the variable model of declaration
   */
  getDeclare: function() {
    return {
      name: this.getFieldValue('VAR'),
      type: this.getType(),
      dist: this.getDist(),
      spec: this.getSpec()
    };
  },

  onchange: Blockly.Constants.Variables.forPlacementCheck,


}

Blockly.Blocks['variables_get'] = {
  init: function(dist) {
    this.setColour(350);
    this.appendDummyInput()
        .appendField(Blockly.Msg.VARIABLES_GET_TITLE)
        .appendField("get")
        .appendField(new Blockly.FieldDropdown(
            this.generateOptions),
            "VAR")
        .appendField(Blockly.Msg.VARIABLES_GET_TAIL);
    this.setOutput(true, 'VAR');

    this.setTooltip("%{BKY_VARIABLES_SET_TOOLTIP}");
    this.setHelpUrl("%{BKY_VARIABLES_SET_HELPURL}");
    this.declarator_ = null;
  },

  getDist: function() {
    return 'v';
  },

  getVar: function() {
    return this.getFieldValue('VAR');
  },

  getType: function() {
    return (this.declarator_ ? this.declarator_.getType() : undefined);
  },

  getType: function() {
    return (this.declarator_ ? this.declarator_.getSpec() : undefined);
  },

  generateOptions: function () {
    var self = this.getSourceBlock();
    // search for all variables in scope matching dist
    var variables = [];
    if (self) {
      variables = Blockly.Constants.Variables.getVariablesInScope(self, {dist: [self.getDist(), 'r']})
                    .map(function(e) { return e.name; });
    }

    // Ensure that the currently selected variable is an option.
    var name = this.getText();
    if (name && variables.indexOf(name) == -1) {
      variables.push(name);
    } else {
      variables.push("");
    }
    // Variables are not language-specific, use the name as both the user-facing
    // text and the internal representation.
    return variables.map(function(n) { return [n, n]; });
  },

  /**
   * Notification that a variable is being renamed
   * @param {*} newName new name of the variable
   * @param {*} declarator the declaration or procedure block that is performing the rename.
   */
  renameVar: function(newName, declarator) {
    // check declartor matches, update this var name
  },

  /**
   * Notification that workspace has changed.
   * We need to update our declartor
   * @param {} e
   */
  onchange: function(e) {
    Blockly.Constants.Variables.updateVariableDeclarator(this);
  },

};

Blockly.Blocks['variables_set'] = {
  init: function() {
    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField(Blockly.Msg.VARIABLES_SET_TITLE)
        .appendField(new Blockly.FieldDropdown(Blockly.Blocks['variables_get'].generateOptions), "VAR")
        .appendField(Blockly.Msg.VARIABLES_SET_TAIL)
    this.setPreviousStatement(true, ["STATEMENT", "SET"]);
    this.setNextStatement(true, ["STATEMENT", "SET"]);
    this.setColour(350);
    this.setTooltip(Blockly.Msg.VARIABLES_DECLARE_TOOLTIP);
  },

  getDist: function() {
    return 'v';
  },

  getVar: function() {
    return this.getFieldValue('VAR');
  },

  getType: function() {
    return (this.declarator_ ? this.declarator_.getType() : undefined);
  },

  getType: function() {
    return (this.declarator_ ? this.declarator_.getSpec() : undefined);
  },

  /**
   * Notification that workspace has changed.
   * @param {} e
   */
  onchange: function(e) {
    // We need to update our declartor
    Blockly.Constants.Variables.updateVariableDeclarator(this);
    // check if block is within a for init or inc statement
    Blockly.Constants.Variables.forPlacementCheck(this);
  },

}
/**
 * Returns an ordered list of variable models in scope of current block
 * @param {Blockly.Block} block
 * @param {Object} matching Object of key:value to extract
 */
Blockly.Constants.Variables.getVariablesInScope = function(block, matching) {
  var varList = [];
  var blocks = Blockly.Constants.Variables.getBlocksInScope(block, false);
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    if (block.getParams) {
      // Procedure block
      for (var param of block.getParams()) {
        param.block = block;
        varList.push(param);
      }
    } else if (block.getDeclare) {
      // Declaration block
      var b = block.getDeclare();
      b.block = block;
      varList.push(b);
    }
  }
  if (matching) {
    var wantedList = [];
    for (var i = 0; i < varList.length; i++) {
      if (Object.keys(matching).reduce(function (acc, key) {
          return acc && (Array.isArray(matching[key])
               ? matching[key].includes(varList[i][key])
               : varList[i][key] == matching[key])
      }, true))
        wantedList.push(varList[i]);
    }
    return wantedList;
  } else
    return varList;
}

/**
 * Returned an ordered list of blocks in the current block's scope,
 * from closest to furthest.
 * @param {Blockly.Block} block
 * @param {boolean} include Optionally include current block if true
 */
Blockly.Constants.Variables.getBlocksInScope = function(block, include) {
  var blocks = [];
  if (include) {
    blocks.push(block);
  }
  var parent;
  while (parent = block.getParent()) {
    if (parent.type == "controls_for"
          && parent.getNextBlock() != block
          && parent.getInputTargetBlock("INIT") != block) {
        // add the init in a forloop if block not the INIT block or the next statement block.
        blocks.push(parent.getInputTargetBlock("INIT"));
      } else if (parent.type == "procedures_defreturn"
                 && parent.getInputTargetBlock("RETURN") == block) {
        for (parent = parent.getInputTargetBlock("STACK"); parent.getNextBlock(); parent = parent.getNextBlock()) {}
      }
      block = parent;
      blocks.push(block);
  }
  return blocks;
}

/**
 * Search upwards through the scope to locate the variable declarator
 * @param {} block
 */
Blockly.Constants.Variables.updateVariableDeclarator = function(self) {
  if (!self) {
    self = this;
  }
  // search for first variable in scope matching name
  var field = self.getField('VAR');
  var value = field.getValue();
  var block = Blockly.Constants.Variables.getVariablesInScope(self, {name: value});
  if (block && block.length) {
    self.declarator_ = block[0];
    field.doValueUpdate_(value);
    // TODO: update output type?
  } else {
    self.declarator_ = null;
    field.doValueInvalid_(value)
  }
}

/**
 * Check if the statement block is used in a for-loop initialization or increment.
 * @param {*} block
 */
Blockly.Constants.Variables.forPlacementCheck = function(block) {
  if (!block) {
      block = this;
  }
  if (!block.workspace) {
      // Block has been deleted.
      return;
  }
  if (block.getSurroundParent()
        && block.getSurroundParent().type == "controls_for"
        && [block.getSurroundParent().getInputTargetBlock("INIT"),
            block.getSurroundParent().getInputTargetBlock("INC")].indexOf(block) >= 0) {

      if (block.getNextBlock()) {
          block.getNextBlock().unplug(false);
      }
      block.setNextStatement(false);
  } else if (!block.nextConnection) {
      block.setNextStatement(true, block.previousConnection.check_);
  }
};