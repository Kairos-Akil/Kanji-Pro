import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const RadicalsLevel1Layout = () => (
    <TopSlider
        tabs={[
            buildTab('radicalsLevel1', 'radicals_level1'),
        ]}
    />
)

export default RadicalsLevel1Layout
