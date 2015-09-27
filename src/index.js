import assign from 'lodash/object/assign';
import isEmpty from 'lodash/lang/isEmpty';
import isFunction from 'lodash/lang/isFunction';
import merge from 'lodash/object/merge';

import {
  compose,
  getReactDescriptor,
  parseDesc,
  dupeFilter,
} from './utils';

/**
 * [createStamp description]
 *
 * @param  {[type]} React [description]
 * @param  {Object} desc [description]
 *
 * @return {[type]} [description]
 */
export default function createStamp(React, desc = {}) {
  let reactDesc = getReactDescriptor(React && React.Component);
  const { methods, ...specDesc } = parseDesc(desc);

  /**
   * Make sure the descriptor is not overriding React's
   * `setState` and `forceUpdate` methods.
   */
  assign(reactDesc.methods, methods, dupeFilter);
  merge(reactDesc, specDesc);

  const stamp = (...args) => {
    const instance = Object.create(reactDesc.methods);

    reactDesc.initializers.forEach(initializer => {
      if (!isFunction(initializer)) return;

      initializer.apply(instance, [ args, { instance, stamp } ]);
    });

    assign(instance, reactDesc.properties);
    merge(instance, reactDesc.deepProperties);
    Object.defineProperties(instance, reactDesc.propertyDescriptors);
    merge(instance, reactDesc.configuration);

    return instance;
  }

  assign(stamp, reactDesc.staticProperties);
  merge(stamp, reactDesc.deepStaticProperties);
  Object.defineProperties(stamp, reactDesc.staticPropertyDescriptors);

  stamp.compose = assign(compose.bind(stamp), reactDesc);

  return stamp;
}
