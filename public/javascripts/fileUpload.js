/* This gets all css style roots that have the :root*/
const rootStyles = window.getComputedStyle(document.documentElement);

/* Make sure that it's not undefined*/
if (
  rootStyles.getPropertyValue("--book-cover-width-large") != null &&
  rootStyles.getPropertyValue("--book-cover-width-large") !== ""
) {
  ready();
} else {
  /* If it is not defined then wait untill the css is loaded and run ready function*/
  document.getElementById("main-css").addEventListener("load", ready);
}

// Settings for FilePond, uploading book covers
function ready() {
  const coverWidth = parseFloat(
    rootStyles.getPropertyValue("--book-cover-width-large")
  );
  const coverAspectRatio = parseFloat(
    rootStyles.getPropertyValue("--book-cover-aspect-ratio")
  );
  const coverHeigt = coverWidth / coverAspectRatio;
  FilePond.registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginFileEncode
  );

  FilePond.setOptions({
    stylePanelAspectRatio: 1 / coverAspectRatio,
    imageResizeTargetWidth: coverWidth,
    imageResizeTargetHeight: coverHeigt,
  });

  FilePond.parse(document.body);
}
