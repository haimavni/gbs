import { TapAndHoldCustomAttribute } from "./attributes/tapandhold";
import { ChatButtonCustomElement } from "./elements/chats/chat-button";
import { ChatroomCustomElement } from "./elements/chats/chatroom";
import { ChatroomGroupCustomElement } from "./elements/chats/chatroom-group";
import { DateRangeCustomElement } from "./elements/date-range";
import { FieldControlCustomElement } from "./elements/db-form/field-control";
import { TableFormCustomElement } from "./elements/db-form/table-form";
import { DlgStringCustomElement } from "./elements/dlg-string";
import { EditSideBySideCustomElement } from "./elements/edit-side-by-side";
import { editableCustomElement } from "./elements/editable";
import { fitTextCustomElement } from "./elements/fit-text";
import { HelpCustomElement } from "./elements/help";
import { InfoCustomElement } from "./elements/info";
import { LetterCustomElement } from "./elements/letter";
import { LocalePickerCustomElement } from "./elements/locale-picker";
import { MultiSelectCustomElement } from "./elements/multi-select/multi-select";
import { MyMapCustomElement } from "./elements/my-map/my-map";
import { PartialDateCustomElement } from "./elements/partial-date";
import { PhotoStripCustomElement } from "./elements/photo-strip";
import { Picker } from "./elements/picker/picker";
import { ProgressBarCustomElement } from "./elements/progress-bar";
import { QuickLogin } from "./elements/quick-login";
import { QuizCustomElement } from "./elements/quiz/quiz";
import { RenderStoryCustomElement } from "./elements/render-story";
import { RollerCustomElement } from "./elements/roller";
import { SearchInputCustomElement } from "./elements/search-input";
import { SelectorCustomElement } from "./elements/selector";
import { TimelineCustomElement } from "./elements/timeline";
import { HtmlPlayerCustomElement } from "./elements/video/html-player";
import { YtPlayerCustomElement } from "./elements/video/yt-player";
import { FilterValueConverter } from "./value-converters/filter";
import { FilterBySetValueConverter } from "./value-converters/filter-by-set";
import { FilterGenderValueConverter } from "./value-converters/filter-gender";
import { FiltervisibilityValueConverter } from "./value-converters/filter-visibility";
import { FormatdateValueConverter } from "./value-converters/format-date";
import { FormatTimeValueConverter } from "./value-converters/format-time";
import { KeeplenValueConverter } from "./value-converters/keeplen";
import { SortValueConverter } from "./value-converters/sort";
import { SpyValueConverter } from "./value-converters/spy";
import { TakeValueConverter } from "./value-converters/take";

export const Resources = [
    TapAndHoldCustomAttribute,
    FilterValueConverter,
    FilterBySetValueConverter,
    TakeValueConverter,
    SpyValueConverter,
    FiltervisibilityValueConverter,
    FilterGenderValueConverter,
    SortValueConverter,
    KeeplenValueConverter,
    FormatdateValueConverter,
    FormatTimeValueConverter,
    MultiSelectCustomElement,
    Picker,
    SelectorCustomElement,
    PhotoStripCustomElement,
    editableCustomElement,
    RollerCustomElement,
    PartialDateCustomElement,
    DateRangeCustomElement,
    HelpCustomElement,
    InfoCustomElement,
    LetterCustomElement,
    TimelineCustomElement,
    SearchInputCustomElement,
    DlgStringCustomElement,
    LocalePickerCustomElement,
    ChatroomGroupCustomElement,
    ChatroomCustomElement,
    ChatButtonCustomElement,
    QuizCustomElement,
    QuickLogin,
    EditSideBySideCustomElement,
    RenderStoryCustomElement,
    fitTextCustomElement,
    MyMapCustomElement,
    ProgressBarCustomElement,
    YtPlayerCustomElement,
    HtmlPlayerCustomElement,
    FieldControlCustomElement,
    TableFormCustomElement,
];
