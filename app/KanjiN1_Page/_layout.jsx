import KanjiN1Tier1 from './kanjiN1Tier1'
import KanjiN1Tier2 from './kanjiN1Tier2'
import KanjiN1Tier3 from './kanjiN1Tier3'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN1Tier1', KanjiN1Tier1, 'kanji_n1_tier1'),
            buildTab('kanjiN1Tier2', KanjiN1Tier2, 'kanji_n1_tier2'),
            buildTab('kanjiN1Tier3', KanjiN1Tier3, 'kanji_n1_tier3'),
        ]}
    />
)

export default KanjiLayout
