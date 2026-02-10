import { reactive, nextTick, watch } from "vue";

export function useTimelineScroll(refs, params) {
  const { mainScroll, headerScroll, sidebarScroll } = refs;
  const { dayWidth, trackHeight } = params;

  const scrollState = reactive({ left: 0, width: 0, client: 0 });
  const verticalScrollState = reactive({ top: 0, height: 0, client: 0 });

  const syncScrolls = (e) => {
    const el = e.target;
    scrollState.left = el.scrollLeft;
    scrollState.width = el.scrollWidth;
    scrollState.client = el.clientWidth;

    verticalScrollState.top = el.scrollTop;
    verticalScrollState.height = el.scrollHeight;
    verticalScrollState.client = el.clientHeight;

    if (headerScroll.value?.$el) headerScroll.value.$el.scrollLeft = el.scrollLeft;
    if (sidebarScroll.value?.$el) sidebarScroll.value.$el.scrollTop = el.scrollTop;
  };

  const applyScroll = (v) => { if (mainScroll.value) mainScroll.value.scrollLeft = v; };
  const applyVerticalScroll = (v) => { if (mainScroll.value) mainScroll.value.scrollTop = v; };

  const handleZoom = (data) => {
    const el = mainScroll.value;
    if (!el) return;

    const oldW = dayWidth.value;
    const newW = typeof data === 'object' ? data.value : data;
    const anchor = data.anchor || 'right';
    const ratio = newW / oldW;

    const currentRight = el.scrollLeft + el.clientWidth;
    const currentLeft = el.scrollLeft;

    dayWidth.value = newW;

    nextTick(() => {
      el.scrollLeft = anchor === 'left' ? (currentRight * ratio) - el.clientWidth : currentLeft * ratio;
      scrollState.width = el.scrollWidth;
      scrollState.left = el.scrollLeft;
    });
  };

  const handleVerticalZoom = (data) => {
    const el = mainScroll.value;
    if (!el) return;

    const oldH = trackHeight.value;
    const newH = typeof data === 'object' ? data.value : data;
    const anchor = data.anchor || 'bottom';
    const ratio = newH / oldH;

    const currentTop = el.scrollTop;
    const currentBottom = el.scrollTop + el.clientHeight;

    trackHeight.value = newH;

    nextTick(() => {
      el.scrollTop = anchor === 'top' ? (currentBottom * ratio) - el.clientHeight : currentTop * ratio;
      verticalScrollState.height = el.scrollHeight;
      verticalScrollState.top = el.scrollTop;
    });
  };

  const updateScrollDimensions = () => {
    if (mainScroll.value) {
      const el = mainScroll.value;
      scrollState.width = el.scrollWidth;
      scrollState.client = el.clientWidth;
      scrollState.left = el.scrollLeft;
      verticalScrollState.height = el.scrollHeight;
      verticalScrollState.client = el.clientHeight;
      verticalScrollState.top = el.scrollTop;
    }
  };

  return {
    scrollState,
    verticalScrollState,
    syncScrolls,
    applyScroll,
    applyVerticalScroll,
    handleZoom,
    handleVerticalZoom,
    updateScrollDimensions
  };
}
