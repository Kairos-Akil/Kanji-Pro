import KanjiN2Tier1 from './kanjiN2Tier1'
import KanjiN2Tier2 from './kanjiN2Tier2'
import KanjiN2Tier3 from './kanjiN2Tier3'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN2Tier1', KanjiN2Tier1, 'kanji_n2_tier1'),
            buildTab('kanjiN2Tier2', KanjiN2Tier2, 'kanji_n2_tier2'),
            buildTab('kanjiN2Tier3', KanjiN2Tier3, 'kanji_n2_tier3'),
        ]}
    />
)

export default KanjiLayout
