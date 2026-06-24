[![build and test](https://github.com/tfrizzell/harnessnation-plus/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/tfrizzell/harnessnation-plus/actions/workflows/build-and-test.yml)

# harnessnation-plus
**HarnessNation+** Extension - Enhance your [HarnessNation](https://www.harnessnation.com) experience with a convenient browser extension!

## Features

See the [features page on our wiki](https://github.com/tfrizzell/harnessnation-plus/wiki/Features) for a complete list of features, bug fixes, and other enhancements.

## Installation

### <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" height="30" valign="text-bottom" /> &nbsp; Google Chrome

[Install **HarnessNation+** on Google Chrome](https://chrome.google.com/webstore/detail/harnessnation%20/aonknefdnheomhlfcnjdicnkbfdakcdo)

### <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" height="30" valign="text-bottom" /> &nbsp; Microsoft Edge

[Install **HarnessNation+** on Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/harnessnation/joniipgaaolooildpfoinglgbfefjobk)

### <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" height="30" valign="text-bottom" /> &nbsp; Mozilla Firefox

[Install **HarnessNation+** on Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/harnessnation-plus/)

### <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/Chromium_Logo.svg" height="30" valign="text-bottom" /> &nbsp; Other Chromium-based Browsers

Other Chromium-based browsers, such as Brave, Opera, and Vivaldi are compatible with the [Google Chrome version of **HarnessNation+**](#google-chrome)

## Features

See the [version history page on our wiki](https://github.com/tfrizzell/harnessnation-plus/wiki/Version-History) for information about the progression of **HarnessNation+** over time.

## Development Dependencies

The following dependencies are include in the project to provide typings for internal libraries or compatibility with the libraries used on HarnessNation. The versions should remain pinned to the versions used in practice.

 **Package**                 | **Version**    | **Description**
:----------------------------|:--------------|:--------------------------------------------
 **`@types/jquery`**         | **`3.3.1`**   | Pinned to the version used by [HarnessNation](https://www.harnessnation.com)
 **`@types/datatables.net`** | **`1.10.18`** | Pinned to the version used by [HarnessNation](https://www.harnessnation.com)
 **`firebase`**              | **`12.15.0`** | Pinned to the version deployed in [*`src/vendor/firebasejs`*](./src/vendor/firebasejs)
 **`pdf-lib`**               | **`1.17.1`**  | Pinned to the version deployed in [*`src/vendor/pdf-lib`*](./src/vendor/pdf-lib)
