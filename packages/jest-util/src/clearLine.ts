/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function clearLine(stream: NodeJS.WriteStream) {
  if (stream && stream.isTTY) {
    stream.write('\x1b[999D\x1b[K');
  }
}
