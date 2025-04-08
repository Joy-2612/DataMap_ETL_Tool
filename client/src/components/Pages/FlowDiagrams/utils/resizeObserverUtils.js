const resizeObserverErr = () => {
    const err = window.onerror;
    window.onerror = function(msg, source, line, column, error) {
      if (msg === 'ResizeObserver loop completed with undelivered notifications') {
        return true;
      }
      return err && err(msg, source, line, column, error);
    };
  };
  
  export default resizeObserverErr;