import KanjiN3Tier1 from './kanjiN3Tier1'
import KanjiN3Tier2 from './kanjiN3Tier2'
import KanjiN3Tier3 from './kanjiN3Tier3'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN3Tier1', KanjiN3Tier1, 'kanji_n3_tier1'),
            buildTab('kanjiN3Tier2', KanjiN3Tier2, 'kanji_n3_tier2'),
            buildTab('kanjiN3Tier3', KanjiN3Tier3, 'kanji_n3_tier3'),
        ]}
    />
)

export default KanjiLayout
